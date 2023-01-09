import { createRef, useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import "./style.css"

const labels = [
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'
]

export default function Graph({
	SVG_WIDTH = 1800,
	SVG_HEIGHT = 1000,
	SVG_MARGIN_X = 50,
	SVG_MARGIN_Y = 50,
	G_GAP = 20,
	PROG_SVG_WIDTH = SVG_WIDTH,
	PROG_SVG_HEIGHT = 150,
	PROG_SVG_MARGIN_X = 50,
	PROG_SVG_MARGIN_Y = 20,

	LEGEND_WIDTH = 1800,
	LEGEND_HEIGHT = 70,
	LEGEND_MARGIN_X = 30,
	LEGEND_MARGIN_Y = 30,

	data,
	dataSourceId,
	groupIds,
	propNum,
}) {

	const svgRef = useRef()
	const progSvgRef = useRef()
	const legendSvgRef = useRef()
	
	const updateScaRef = useRef()
	const updateParRef = useRef()
	const updateProgRef = useRef()

	const previousData = useRef()

	useEffect(() => {
		const scaCordX = SVG_MARGIN_X
		const scaCordY = SVG_MARGIN_Y
		const scaWidth = SVG_WIDTH - SVG_MARGIN_X*2
		const scaHeight = SVG_HEIGHT - SVG_MARGIN_Y*2

		d3.select(svgRef.current).selectChild('.scatters').remove()
		const g_sca = d3.select(svgRef.current)
			.append('g').attr('transform', `translate(${[scaCordX, scaCordY]})`).attr('class', 'scatters')

		const parCordX = SVG_MARGIN_X
		const parCordY = ((propNum & 1) ? SVG_HEIGHT * 0.5 : SVG_HEIGHT * 0.4) + G_GAP
		const parWidth = (((propNum & 1)) ? SVG_WIDTH * 0.5 : SVG_WIDTH * 0.4) - G_GAP - parCordX
		const parHeight = SVG_HEIGHT - parCordY - SVG_MARGIN_Y

		console.log(propNum, parWidth, parHeight)

		d3.select(svgRef.current).selectChildren('.parallel-cord').remove()
		const g_par = d3.select(svgRef.current).append('g').attr('transform', `translate(${[parCordX, parCordY]})`).attr('class', 'parallel-cord')
		const colors = d3.scaleOrdinal().domain(groupIds).range(d3.schemeCategory10)

		const { update: updateSca } = plotScatters({
			g: g_sca,
			propNum,
			width: scaWidth,
			height: scaHeight,
			gap: 30,
			labels,
			colors,
			groupIds,
		})
		updateScaRef.current = updateSca
		
		const { update: updatePar } = plotParallelCoord({
			g: g_par,
			propNum,
			groupIds,
			colors,
			width: parWidth,
			height: parHeight,
			labels
		})
		updateParRef.current = updatePar


		d3.select(progSvgRef.current).selectChild('g.main').remove()
		const g_pro = d3.select(progSvgRef.current)
			.append('g')
			.attr('class', 'main')
			.attr('transform', `translate(${[PROG_SVG_MARGIN_X, PROG_SVG_MARGIN_Y]})`)

		const { update: updateProg } = plotProgress({
			g: g_pro,
			propNum,
			groupIds,
			colors,
			width: PROG_SVG_WIDTH - PROG_SVG_MARGIN_X*2,
			height: PROG_SVG_HEIGHT - PROG_SVG_MARGIN_Y*2,
		})
		updateProgRef.current = updateProg

		d3.select(legendSvgRef.current).selectChild('g.main').remove()
		const g_legend = d3.select(legendSvgRef.current)
			.append('g')
			.attr('class', 'main')
			.attr('transform', `translate(${[LEGEND_MARGIN_X, LEGEND_MARGIN_Y]})`)

		plotLegend({
			colors,
			groupIds,
			width: LEGEND_WIDTH - LEGEND_MARGIN_X*2,
			g: g_legend
		})

		previousData.current = {}



	}, [dataSourceId])


	useEffect(() => {
		if (updateParRef.current && updateProgRef.current && updateScaRef.current && data) {
			for (const groupId in data) {
				if (previousData.current[groupId] === data[groupId]) continue
				const d = data[groupId]
				previousData.current[groupId] = d
				updateParRef.current({data: d, groupId})
				updateScaRef.current({data: d, groupId})
				updateProgRef.current({data: [d.length], groupId})
			}
			
		}
	}, [data])

	return <div>
		<div>
		<svg ref={legendSvgRef} style={{width: LEGEND_WIDTH, height: LEGEND_HEIGHT}}></svg>
		</div>
		<svg ref={svgRef} style={{width: SVG_WIDTH, height: SVG_HEIGHT}}></svg>	
		<svg ref={progSvgRef} style={{width: PROG_SVG_WIDTH, height: PROG_SVG_HEIGHT}}></svg>
	</div>
}

function plotScatter({
	g,
	x_index,
	y_index,
	scaleX,
	scaleY,
	axisX,
	axisY,
	r = 3,
	colors,
}) {
	// TODO: using the stroke-end property to draw circles
	g.append('g').attr('class', 'axis-x').call(axisX)
	 .attr('transform', `translate(${[0, scaleY.range()[0]]})`)
	g.append('g').attr('class', 'axis-y').call(axisY)
	
	return {
		update({data: newData, groupId}) {
			const fillColor = colors(groupId)
			g.select('.axis-x').call(axisX)
			g.select('.axis-y').call(axisY)
			g.selectAll(`circle.${groupId}`).data(newData, d => d.hash).join(
				enter => enter.append('circle')
					.attr('cx', d => scaleX(d.f[x_index]))
					.attr('cy', d => scaleY(d.f[y_index]))
					.attr('opacity', .36)
					.attr('r', r)
					.attr('class', groupId)
					.attr('fill', fillColor),

				update => update
					.transition().duration(100)
					.attr('cx', d => scaleX(d.f[x_index]))
					.attr('cy', d => scaleY(d.f[y_index])),

				exit => exit.remove()
			)
		}
	}
}

export function plotScatters({
	g,
	propNum,
	width,
	height,
	gap,
	labels,
	colors,
	groupIds,
}) {
	const LABEL_SIZE = 14

	const prop_num = propNum
	const scp_width = (width - gap * (prop_num - 2)) / (prop_num - 1)
	const scp_height = (height- gap * (prop_num - 2)) / (prop_num - 1)

	const scale_xs = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().range([0, scp_width]).domain([0, scp_width])
	)
	const scale_ys = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().range([scp_height, 0]).domain([0, scp_width])
	)
	const axis_xs = [...Array(prop_num).keys()].map(
		k => d3.axisTop(scale_xs[k]).tickSizeInner(scp_height).tickSizeOuter(scp_height)
	)
	const axis_ys = [...Array(prop_num).keys()].map(
		k => d3.axisRight(scale_ys[k]).tickSizeInner(scp_width).tickSizeOuter(scp_width)
	)

	const scatters = []


	for (let i = 0; i < prop_num; ++i) {
		const row_g = g.append('g').attr('transform', `translate(0,${(scp_height + gap)*i})`).attr('class', 'row')
		for (let j = i+1; j < prop_num; ++j) {
			const scp_g = row_g.append('g').attr('transform', `translate(${[ (scp_width + gap)*(j-1), 0 ]})`)
			const scatter = plotScatter({
				colors,
				g: scp_g,
				x_index: j,
				y_index: i,
				scaleX: scale_xs[j],
				scaleY: scale_ys[i],
				axisX: axis_xs[j],
				axisY: axis_ys[i],
			})
			scatters.push(scatter)
		}
	}

	g.append('g').attr('class', 'label-x')
	 .attr('transform', `translate(${[0, -LABEL_SIZE]})`)
	 .call(g => {
		labels.slice(1, propNum).forEach((label, idx) => 
			g.append('text').text(label)
			 .attr('transform', `translate(${(scp_width + gap)*(idx) + scp_width/2})`)
			 .attr('text-anchor', 'middle')
			 .style('font-size', LABEL_SIZE)
		)
	})

	g.append('g').attr('class', 'label-y')
	 .attr('transform', `translate(${width + LABEL_SIZE*1.5})`)
	 .call(g => {
		labels.slice(0, propNum).forEach((label, idx) => 
			g.append('text').text(label)
			.attr('text-anchor', 'middle')
			.style('transform-box', 'fill-box')
			.style('transform-origin', 'bottom center')
			.style('font-size', LABEL_SIZE)
			.attr('transform', `translate(${[0, (scp_height + gap)*idx + scp_height/2]}) rotate(90)`)
	 )
	})

	const currentExtents = {}
	const currentData = {}
	groupIds.forEach(groupId => {
		currentExtents[groupId] = [...Array(prop_num).keys()].map(_ => [undefined, undefined])
		currentData[groupId] = []
	})

	return {
		update({data: newData, groupId}) {
			const newExtents = [...Array(prop_num).keys()].map(k => d3.extent(
				newData.map(d => d.f[k])
			))
			currentExtents[groupId] = newExtents.map(ext => [...ext])

			const otherGroupIds = groupIds.filter(id => id !== groupId)
			otherGroupIds.forEach(id => {
				for (const i in newExtents) {
					newExtents[i][0] = d3.min([newExtents[i][0], currentExtents[id][i][0]])
					newExtents[i][1] = d3.max([newExtents[i][1], currentExtents[id][i][1]])
				}
			})
			
			
			

			scale_xs.forEach((scaleX, idx) => scaleX.domain(newExtents[idx]))
			scale_ys.forEach((scaleY, idx) => scaleY.domain(newExtents[idx]))
			scatters.forEach(scatter => scatter.update({ data: newData, groupId }))
			otherGroupIds.forEach(id => {
				scatters.forEach(scatter => scatter.update({ data: currentData[id], groupId: id }))	
			})

			currentData[groupId] = newData
			
		}
	}
}

export function plotParallelCoord({
	g,
	propNum,
	height,
	width,
	labels,
	colors,
	groupIds,
}) {
	const tick_size = 3
	const prop_num = propNum
	const gap = (width - tick_size) / (prop_num - 1)
	const margin_top = 20
	const font_size = 14
	const scale_ys = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().domain([0, 100]).range([height, margin_top])
	)
	const axes = [...Array(prop_num).keys()].map(
		k => d3.axisRight(scale_ys[k]).tickSize(tick_size)
	)
	axes.forEach((axis, idx) => {
		const axis_g = g.append('g').attr('class', 'axis')
		axis_g.call(axis).attr('transform', `translate(${gap * idx})`)
		axis_g.append('text').text(labels[idx]).style('font-size', font_size + 'px')
					.attr('fill', 'black')
					.attr('text-anchor', 'middle')
	})

	const line = d3.line().x((d, i) => gap * i).y((d, i) => scale_ys[i](d)).curve(d3.curveMonotoneX)

	const lines_gs = {}
	groupIds.forEach(groupId => {
		lines_gs[groupId] = g.append('g').attr('class', groupId)
	})

	const currentExtents = {}
	const currentData = {}
	groupIds.forEach(groupId => {
		currentData[groupId] = []
		currentExtents[groupId] = [...Array(prop_num).keys()].map(_ => [undefined, undefined])
	})



	return {
		update ({data: newData, groupId}) {

			const newExtents = [...Array(prop_num).keys()].map(k => d3.extent(
				newData.map(d => d.f[k])
			))
			
			currentExtents[groupId] = newExtents.map(ext => [...ext])
			groupIds.filter(id => id !== groupId).forEach(id => {
				for (const i in newExtents) {
					newExtents[i][0] = d3.min([newExtents[i][0], currentExtents[id][i][0]])
					newExtents[i][1] = d3.max([newExtents[i][1], currentExtents[id][i][1]])
				}
			})

			currentData[groupId] = newData

			scale_ys.forEach((s, idx) => s.domain(newExtents[idx]))
			g.selectAll('.axis')
			 .each(function (_, idx) {
				d3.select(this).call(axes[idx])
			 })


			// TODO: update graph according to the changed axis

			groupIds.forEach(id => lines_gs[id].selectAll('path').data(currentData[id], d => d.hash).join(
				enter => enter.append('path')
					.attr('d', d => line(d.f)).attr('class', 'line')
					.attr('stroke', colors(id)),
				update => update
					.transition().duration(100)
					.attr('d', d => line(d.f)),
				exit => exit.remove()
			))
		},
	}
}

export function plotProgress({
	g,
	groupIds,
	width,
	height,
	colors
}) {
	const data = {}
	groupIds.forEach(id => {
		data[id] = []
	})
	let upperYDomain = 10

	const scaleY = d3.scaleLinear().domain([0, upperYDomain]).range([height, 0])
	const scaleX = d3.scaleLinear().domain([1, 10]).range([0, width])
	const axisY = d3.axisLeft(scaleY)
	const axisX = d3.axisBottom(scaleX)

	const gy = g.append('g').call(axisY)
	const gx = g.append('g').attr('transform', `translate(${[0, height]})`).call(axisX)

	const line = d3.line().x((d, i) => scaleX(i + 1)).y(scaleY)

	const paths = {}
	groupIds.forEach(groupId => {
		paths[groupId] = g.append('path').datum(data[groupId]).attr('d', line)
		.style('stroke', colors(groupId))
		.style('stroke-width', 1)
		.style('fill', 'none') 
		.attr('class', groupId)
	})

	return {
		update({
			data: da,
			groupId,
		}) {
			data[groupId].push(...da)
			const rounds = data[groupId].length
			const upperXDomain = scaleX.domain()[1]
			const maxD = d3.max(da)

			let axisScaleChanged = false

			if (rounds >= upperXDomain) {
				scaleX.domain([0, Math.ceil(upperXDomain * 1.4)])
				gx.call(axisX)
				axisScaleChanged = true
			}

			if (maxD > upperYDomain) {
				upperYDomain = Math.ceil(maxD * 1.2)
				scaleY.domain([0, upperYDomain])
				gy.call(axisY)
				axisScaleChanged = true
			}

			if (axisScaleChanged) {
				const otherGroupIds = groupIds.filter(id => id !== groupId)
				otherGroupIds.forEach(id => paths[id].transition().duration(50).attr('d', line))
			}

			paths[groupId].transition().duration(50).attr('d', line)
		}
	}
}


function plotLegend({
	colors,
	groupIds,
	g,
	width,
}) {
	const span = width / groupIds.length
	g.selectAll('g').data(groupIds).join('g')
		.each(function (groupId, index) {
			const gg = d3.select(this)
			gg.append('circle').attr('fill', colors(groupId))
				.attr('r', 5)
			gg.append('text').text(groupId)
				.attr('x', 20)
				.style('font-size', 16)
				.attr('y', 5)
		})
		.attr('transform', (_, i) => `translate(${i * span})`)
}