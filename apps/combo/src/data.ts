export type Mode = 'planning' | 'reflection';

export type Souvenir = {
  id: string;
  kind: string;
  label: string;
  description: string;
  invitation: string;
  tags: string[];
};

export const souvenirs: Souvenir[] = [
  { id: 'tea', kind: 'tea', label: 'A little tea ritual', description: 'A celadon cup, a quiet corner, and nowhere else to be.', invitation: 'What would you like to slow down for?', tags: ['Ritual', 'Slow mornings', 'Taste'] },
  { id: 'lantern', kind: 'lantern', label: 'An evening lantern', description: 'Warm light above a narrow street. Follow it a little further.', invitation: 'Where does the evening take you?', tags: ['Evenings', 'Wandering', 'Wonder'] },
  { id: 'ticket', kind: 'ticket', label: 'A ticket out of town', description: 'A window seat and a landscape that keeps changing.', invitation: 'What is waiting beyond the city?', tags: ['Movement', 'Possibility', 'Escape'] },
  { id: 'umbrella', kind: 'umbrella', label: 'A rainy-day detour', description: 'Sometimes the weather makes the best plans for you.', invitation: 'What might you discover along the way?', tags: ['Detours', 'Weather', 'Togetherness'] },
  { id: 'camera', kind: 'camera', label: 'A pocket of moments', description: 'For the ordinary things you might otherwise walk past.', invitation: 'What would you want to remember?', tags: ['Noticing', 'Memory', 'Wandering'] },
  { id: 'book', kind: 'book', label: 'A bookshop afternoon', description: 'A secondhand story and a place to lose track of time.', invitation: 'Which kind of story draws you in?', tags: ['Quiet', 'Stories', 'Discovery'] },
  { id: 'charm', kind: 'charm', label: 'A wish to carry', description: 'A small temple charm for something you hold close.', invitation: 'What wish would you bring with you?', tags: ['Ritual', 'Hope', 'Connection'] },
  { id: 'noodles', kind: 'noodles', label: 'One more night-market stop', description: 'Steam, chatter, and a bowl worth following your nose for.', invitation: 'What tastes like a good evening?', tags: ['Taste', 'Evenings', 'Energy'] },
  { id: 'rain', kind: 'rain', label: 'The sound of rain', description: 'A soft rhythm on the awning. A reason to stay a while.', invitation: 'What does the rain bring back?', tags: ['Weather', 'Quiet', 'Feeling'] },
  { id: 'mountain', kind: 'mountain', label: 'A breath of mountain air', description: 'The city falls away, and the horizon opens up.', invitation: 'Where would you go for a little space?', tags: ['Nature', 'Escape', 'Wonder'] },
  { id: 'record', kind: 'record', label: 'A song from somewhere', description: 'An unexpected soundtrack that follows you home.', invitation: 'Which sound belongs to this journey?', tags: ['Sound', 'Memory', 'Discovery'] },
  { id: 'bicycle', kind: 'bicycle', label: 'The long way around', description: 'Riverside paths, unhurried turns, and room to wander.', invitation: 'What happens when you take your time?', tags: ['Movement', 'Wandering', 'Freedom'] },
];

export const reflectionPrompts = [
  'What does this bring back?',
  'Who was with you in this moment?',
  'What small detail do you still remember?',
  'Did something unexpected change your plans?',
  'What would you like this object to remind you of?',
];
