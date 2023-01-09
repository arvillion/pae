import { Button, Cascader, Select } from 'antd'
import { useEffect, useRef, useState } from 'react';
import Graph from './components/Graph';
import { getAvailAlgorithms, getFileName, getObjsFromOpt, problems } from './utils/data';
import { dataLoader } from './utils/dataLoader';
import { v4 as uuidv4 } from 'uuid';
import { timer } from 'd3';

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


  const newTimer = ({groupId, dataGen, interval = 200}) => {
    const timer = setInterval(() => {
      dataGen.next().then(({ value }) => {
        if (value) setData(previousData => ({
          ...previousData,
          [groupId]: value
        }))
        else {
          clearInterval(timer)
        }
      })
    }, interval)
    return timer
  }

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

  const timers = useRef([])

  const clearAllTimer = () => {
    timers.current.forEach(timer => clearInterval(timer))
    timers.current = []
  }

  const handleStart = () => {
    const dGs = currAlgorithms.map(al => ({
      groupId: al.replaceAll(' ', '-').replaceAll('=', '--'),
      loader: dataLoader( 'data/' + getFileName({
        problemName: currProblem[0],
        problemOpt: currProblem[1],
        algorithm: al
      }))
    }))
    setData({})
    setDataGen(dGs)
    setPaused(false)
    setFinished(false)
    setDataSourceId(uuidv4())
    clearAllTimer()

    dGs.forEach(dG => {
      timers.current.push(newTimer({
        dataGen: dG.loader,
        groupId: dG.groupId,
      }))
    })
  }

  const handlePause = () => {
    setPaused(true)
    clearAllTimer(timers.current)
  }

  const handleContinue = () => {
    setPaused(false)
    dataGen.forEach(dG => {
      timers.current.push(newTimer({
        dataGen: dG.loader,
        groupId: dG.groupId,
      }))
    })
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
      allowClear={false}
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
      dataSourceId={dataSourceId}
      propNum={getObjsFromOpt(currProblem[1])}
      data={data}
      groupIds={dataGen.map(g => g.groupId)}
    />}
  </>;
}

export default App;
