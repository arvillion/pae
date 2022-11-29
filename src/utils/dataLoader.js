import { json } from "d3"

// export async function * dataLoader(interval = 100) {
//   const data = await json('NSGA2_DTLZ1^-1_100_3_20.json')
//   yield Promise.resolve(data[0])
//   for (const idx in data) {
//     if (idx === 1) continue
//     yield new Promise(resolve => {
//       setTimeout(() => resolve(data[idx]), interval)
//     })
//   }
// }

export async function * dataLoader(filePath) {
  const data = await json(filePath)
  for (const idx in data) {
    yield data[idx]
  }
}