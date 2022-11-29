const dataFiles = [
	'NSGA2_DTLZ1^-1_100_5_10.json',
	'CTAEA_DTLZ1^-1_1000_3_10.json',   'NSGA2_DTLZ1^-1_100_5_20.json',
	'CTAEA_DTLZ1^-1_1000_4_10.json',   'NSGA2_DTLZ1^-1_500_3_10.json',
	'CTAEA_DTLZ1^-1_100_3_10.json',    'NSGA2_DTLZ1^-1_500_3_20.json',
	'CTAEA_DTLZ1^-1_100_4_10.json',    'NSGA2_DTLZ1^-1_500_4_10.json',
	'CTAEA_DTLZ1^-1_100_5_10.json',    'NSGA2_DTLZ1^-1_500_4_20.json',
	'CTAEA_DTLZ1^-1_500_3_10.json',    'NSGA2_DTLZ1^-1_500_5_10.json',
	'CTAEA_DTLZ1^-1_500_4_10.json',    'NSGA2_DTLZ1^-1_500_5_20.json',
	'NSGA2_DTLZ1_500_5_20.json',
	'NSGA2_DTLZ1_800_5_20.json',
  'NSGA2_DTLZ2_1000_5_20.json',
	'MOEAD_DTLZ1^-1_1000_3_20.json',   'NSGA2_DTLZ2_100_5_20.json',
	'MOEAD_DTLZ1^-1_100_3_10.json',    'NSGA2_DTLZ2_2000_5_20.json',
	'MOEAD_DTLZ1^-1_100_3_20.json',    'NSGA2_DTLZ2_500_5_20.json',
	'MOEAD_DTLZ1^-1_500_3_10.json',    'NSGA3_DTLZ1^-1_1000_3_10.json',
	'MOEAD_DTLZ1^-1_500_3_20.json',    'NSGA3_DTLZ1^-1_1000_3_20.json',
	'MOEAD_DTLZ1^-1_500_5_20.json',    'NSGA3_DTLZ1^-1_1000_4_10.json',
	'NSGA2_DTLZ1_1000_5_20.json',      'NSGA3_DTLZ1^-1_1000_4_20.json',
	'NSGA2_DTLZ1_100_5_20.json',       'NSGA3_DTLZ1^-1_1000_5_10.json',
	'NSGA2_DTLZ1^-1_1000_10_10.json',  'NSGA3_DTLZ1^-1_1000_5_20.json',
	'NSGA2_DTLZ1^-1_1000_10_20.json',  'NSGA3_DTLZ1^-1_100_3_10.json',
	'NSGA2_DTLZ1^-1_1000_10_5.json',   'NSGA3_DTLZ1^-1_100_3_20.json',
	'NSGA2_DTLZ1^-1_1000_3_10.json',   'NSGA3_DTLZ1^-1_100_4_10.json',
	'NSGA2_DTLZ1^-1_1000_3_20.json',   'NSGA3_DTLZ1^-1_100_4_20.json',
	'NSGA2_DTLZ1^-1_1000_4_10.json',   'NSGA3_DTLZ1^-1_100_5_10.json',
	'NSGA2_DTLZ1^-1_1000_4_20.json',   'NSGA3_DTLZ1^-1_100_5_20.json',
	'NSGA2_DTLZ1^-1_1000_5_10.json',   'NSGA3_DTLZ1^-1_500_3_10.json',
	'NSGA2_DTLZ1^-1_1000_5_20.json',   'NSGA3_DTLZ1^-1_500_3_20.json',
	'NSGA2_DTLZ1^-1_100_3_10.json',    'NSGA3_DTLZ1^-1_500_4_10.json',
	'NSGA2_DTLZ1^-1_100_3_20.json',    'NSGA3_DTLZ1^-1_500_4_20.json',
	'NSGA2_DTLZ1^-1_100_4_10.json',    'NSGA3_DTLZ1^-1_500_5_10.json',
	'NSGA2_DTLZ1^-1_100_4_20.json',    'NSGA3_DTLZ1^-1_500_5_20.json',
]
export const dataSets = dataFiles.map(fileName => {

	const fileNameWithoutExt = fileName.slice(0, -5)
	const segments = fileNameWithoutExt.split('_')
	return {
		algorithm: segments[0],
		problem: segments[1],
		gen: segments[2],
		objs: segments[3],
		vars: segments[4],
		file: fileName,
	}
})

const problemNames = [...new Set(dataSets.map(d => d.problem))]

export const problems = problemNames.map(p => {
	const options = [...new Set(dataSets.filter(d => d.problem === p).map(d => `n_var=${d.vars} n_objs=${d.objs}`))]
	return {
		problem: p,
		options,
	}
})

export function getAvailAlgorithms({ problemName, problemOpt }) {
	const optSegments = problemOpt.split(" ")
	const vars = (optSegments[0].slice(6))
	const objs = (optSegments[1].slice(7))
	return dataSets.filter(d => (d.problem === problemName) && (d.objs == objs) 
		&& (d.vars === vars))
}

export function getFileName({ problemName, problemOpt, algorithm }) {
	const optSegments = problemOpt.split(" ")
	const vars = (optSegments[0].slice(6))
	const objs = (optSegments[1].slice(7))
	const algoSegments = algorithm.split(" ")
	const algoName = algoSegments[0]
	const gen = algoSegments[1].slice(6)
	return `${algoName}_${problemName}_${gen}_${objs}_${vars}.json`
}



