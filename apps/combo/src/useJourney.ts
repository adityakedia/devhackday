import { useEffect, useRef, useState } from "react";
import { journeyApi, JourneyApiError } from "../shared/journey-api";
import type { JourneyAction, JourneyResponse, Mode } from "../worker/journey/types";

export function useJourney(mode: Mode) {
  const [sessions, setSessions] = useState<Partial<Record<Mode, JourneyResponse>>>({});
  const current = useRef(sessions);
  const loading = useRef<Partial<Record<Mode, Promise<JourneyResponse>>>>({});
  const queues = useRef<Record<Mode, Promise<void>>>({ planning: Promise.resolve(), reflection: Promise.resolve() });
  const timers = useRef<Partial<Record<Mode, ReturnType<typeof setTimeout>>>>({});
  const generations = useRef({ planning: 0, reflection: 0 });
  const [pending, setPending] = useState({ planning: 0, reflection: 0 });
  const [aiPending, setAiPending] = useState({ planning: false, reflection: false });
  const [errors, setErrors] = useState<Partial<Record<Mode, string>>>({});

  function accept(next: JourneyResponse) {
    current.current = { ...current.current, [next.mode]: next };
    setSessions(current.current);
    localStorage.setItem(`little-atlas-journey-${next.mode}`, next.id);
    return next;
  }

  function fail(target: Mode, error: unknown) {
    setErrors((old) => ({ ...old, [target]: error instanceof Error ? error.message : "Unable to update this journey." }));
  }

  function ensure(target: Mode): Promise<JourneyResponse> {
    const existing = current.current[target];
    if (existing) return Promise.resolve(existing);
    if (!loading.current[target]) {
      const id = localStorage.getItem(`little-atlas-journey-${target}`);
      loading.current[target] = (id ? journeyApi.get(id) : journeyApi.create(target)).then(accept).finally(() => {
        delete loading.current[target];
      });
    }
    return loading.current[target]!;
  }

  function scheduleInterpretation(target: Mode) {
    clearTimeout(timers.current[target]);
    const generation = ++generations.current[target];
    timers.current[target] = setTimeout(async () => {
      const base = current.current[target];
      if (!base?.fragments.length || base.feedback.interpretationStatus === "current") return;
      setAiPending((old) => ({ ...old, [target]: true }));
      try {
        const next = await journeyApi.interpret(base.id, base.revision, "ai");
        if (current.current[target]?.revision === base.revision) accept(next);
      } catch (error) {
        if (!(error instanceof JourneyApiError && error.status === 409)) fail(target, error);
      } finally {
        if (generation === generations.current[target]) setAiPending((old) => ({ ...old, [target]: false }));
      }
    }, 1000);
  }

  async function write(target: Mode, action: JourneyAction) {
    const base = await ensure(target);
    try {
      return accept(await journeyApi.action(base.id, base.revision, action));
    } catch (error) {
      if (error instanceof JourneyApiError && error.status === 409) {
        const latest = accept(await journeyApi.get(base.id));
        // A concurrent AI refresh changes revision without changing the collection.
        if (action.type !== "choose_reading" && latest.events.length === base.events.length) {
          return accept(await journeyApi.action(latest.id, latest.revision, action));
        }
      }
      throw error;
    }
  }

  function enqueue(work: (session: JourneyResponse, writeAction: (action: JourneyAction) => Promise<JourneyResponse>) => Promise<void>, target: Mode = mode) {
    clearTimeout(timers.current[target]);
    ++generations.current[target];
    setAiPending((old) => ({ ...old, [target]: false }));
    setErrors((old) => ({ ...old, [target]: undefined }));
    setPending((old) => ({ ...old, [target]: old[target] + 1 }));
    queues.current[target] = queues.current[target].then(async () => {
      await work(await ensure(target), (action) => write(target, action));
    }).catch((error) => fail(target, error)).finally(() => {
      setPending((old) => ({ ...old, [target]: old[target] - 1 }));
      scheduleInterpretation(target);
    });
    return queues.current[target];
  }

  useEffect(() => {
    void ensure(mode).then(() => scheduleInterpretation(mode)).catch((error) => fail(mode, error));
  }, [mode]);

  useEffect(() => {
    for (const target of ["planning", "reflection"] as const) {
      if (localStorage.getItem(`little-atlas-journey-${target}`)) void ensure(target).catch((error) => fail(target, error));
    }
    return () => {
      clearTimeout(timers.current.planning);
      clearTimeout(timers.current.reflection);
    };
  }, []);

  return { sessions, session: sessions[mode] ?? null, busy: pending[mode] > 0 || !sessions[mode], aiPending: aiPending[mode], error: errors[mode] ?? null, enqueue, accept, getCurrent: (target: Mode) => current.current[target] };
}
