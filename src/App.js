import { Button, Cascader, Select } from 'antd'
import { useEffect, useRef, useState } from 'react';
import Graph from './components/Graph';
import { getAvailAlgorithms, getFileName, problems } from './utils/data';
import { dataLoader } from './utils/dataLoader';
import { v4 as uuidv4 } from 'uuid';

const cascaderOptions = problems.map(p => ({
  value: p.problem,
  label: p.problem,
  children: p.options.map(o => ({
    value: o,
    label: o,
  }))
}))


function App() {
  const [selectOptions, setSelectOptions] = useState([])
  const [currProblem, setCurrProblem] = useState([problems[0].problem, problems[0].options[0]])
  const [currAlgorithms, setCurrAlgorithms] = useState([])
  const [loading, setLoading] = useState(false)


  const newTimer = ({dataGen, timerRef, interval = 100}) => setInterval(() => {
    dataGen.next().then(({ value }) => {
      if (value) setData(value)
      else {
        clearInterval(timerRef.current)
        setFinished(true)
      }
    })
  }, interval)

  useEffect(() => {
    const algorithms = getAvailAlgorithms({
      problemName: currProblem[0],
      problemOpt: currProblem[1]
    })
    setSelectOptions(algorithms.map(al => ({
      value: `${al.algorithm} n_gen=${al.gen}`,
      label: `${al.algorithm} n_gen=${al.gen}`,
    })))
  }, [currProblem])
  const [data, setData] = useState()
  const [dataGen, setDataGen] = useState()
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const [dataSourceId, setDataSourceId] = useState(uuidv4())

  const timer = useRef()

  const handleStart = () => {
    const dG = dataLoader( 'data/' + getFileName({
      problemName: currProblem[0],
      problemOpt: currProblem[1],
      algorithm: currAlgorithms[0]
    }) )
    setDataGen(dG)
    setPaused(false)
    setFinished(false)
    setDataSourceId(uuidv4())
    clearInterval(timer.current)
    timer.current = newTimer({
      dataGen: dG,
      timerRef: timer
    })
  }

  const handlePause = () => {
    setPaused(true)
    clearInterval(timer.current)
    timer.current = null
  }

  const handleContinue = () => {
    setPaused(false)
    if (!timer.current && dataGen) {
      timer.current = newTimer({
        dataGen,
        timerRef: timer
      })
    }  
  }



  return <>
    <Cascader 
      options={cascaderOptions} 
      // defaultValue={[problems[0].problem, problems[0].options]}
      value={[currProblem[0], currProblem[1]]}
      style={{width: '250px'}}
      onChange={(v) => {
        setCurrProblem(v)
        setCurrAlgorithms([])
      }}
    />

    <Select
      mode="multiple"
      options={selectOptions}
      style={{width: '590px'}}
      allowClear
      value={currAlgorithms}
      onChange={(v) => setCurrAlgorithms(v)}
    />
    <Button type="primary" onClick={handleStart} loading={loading}>Start</Button>
    {!finished && (paused ? <Button onClick={handleContinue}>Continue</Button>
                          : <Button onClick={handlePause}>Pause</Button>)}
    {data && <Graph 
      data={data}
      dataSourceId={dataSourceId}
    />}
  </>;
}

export default App;
