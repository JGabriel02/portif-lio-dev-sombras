export type Point = { x: number; y: number }
export type Offset = { dx: number; dy: number }

export function pupilOffset(
  eye: Point,
  pointer: Point,
  max: Point = { x: 5, y: 3.5 },
): Offset {
  const a = Math.atan2(pointer.y - eye.y, pointer.x - eye.x)
  if (pointer.x === eye.x && pointer.y === eye.y) return { dx: 0, dy: 0 }
  return { dx: Math.cos(a) * max.x, dy: Math.sin(a) * max.y }
}
