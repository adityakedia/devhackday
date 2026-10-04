type IconName = "arrow" | "bag" | "route" | "close" | "plus" | "shuffle" | "pin" | "back" | "check" | "spark";

const paths: Record<IconName, string> = {
  arrow: "M4 12h16M14 6l6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  bag: "M5 7h14l1 14H4L5 7Zm3 0V6a4 4 0 0 1 8 0v1",
  route: "M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 5h10a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h10",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  shuffle: "M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-2 5-4m2-4c1-2 3-4 5-4h3m-4-4 4 4-4 4",
  pin: "m9 3 6 0-1 6 4 4H6l4-4-1-6Zm3 10v8",
  check: "m5 12 4 4L19 6",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
};

export function Icon({ name }: { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
