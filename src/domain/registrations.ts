export function canRegister(capacity: number, registrations: number): boolean {
  return registrations < capacity;
}
