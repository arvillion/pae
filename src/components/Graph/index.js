import { createRef, useEffect, useState } from "react"
import * as d3 from "d3"
import "./style.css"

const labels = [
  'AQI', 'PM 2.5', 'PM 10', 'CO', 'NO₂', 'SO₂', '等级'
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
	data,
	dataSourceId,
}) {
	const svgRef = createRef()
	const progSvgRef = createRef()
	const [updateSca, setUpdateSca] = useState()
	const [updatePar, setUpdatePar] = useState()
	const [updateProg, setUpdateProg] = useState()

	useEffect(() => {
		if (updatePar && updateProg && updateSca && data) {
			// debugger;
			updatePar(data)
			updateSca(data)
			updateProg({
				newData: [data.length]
			})
		}
	}, [data])

	useEffect(() => {
		const propNum = data[0].f.length
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

		d3.select(svgRef.current).selectChildren('.parallel-cord').remove()
		const g_par = d3.select(svgRef.current).append('g').attr('transform', `translate(${[parCordX, parCordY]})`).attr('class', 'parallel-cord')
		
		const { update: updateSca } = plotScatters({
			g: g_sca,
			data: data,
			width: scaWidth,
			height: scaHeight,
			gap: 30,
			labels
		})
		setUpdateSca(() => updateSca)
		
		const { update: updatePar } = plotParallelCoord({
			g: g_par,
			data: data,
			width: parWidth,
			height: parHeight,
			labels
		})
		setUpdatePar(() => updatePar)


		d3.select(progSvgRef.current).selectChild('g.main').remove()
		const g_pro = d3.select(progSvgRef.current)
			.append('g')
			.attr('class', 'main')
			.attr('transform', `translate(${[PROG_SVG_MARGIN_X, PROG_SVG_MARGIN_Y]})`)

		const { update: updateProg } = plotProgress({
			g: g_pro,
			data: [data.length],
			width: PROG_SVG_WIDTH - PROG_SVG_MARGIN_X*2,
			height: PROG_SVG_HEIGHT - PROG_SVG_MARGIN_Y*2,
		})
		setUpdateProg(() => updateProg)
	}, [dataSourceId])

	return <div>
		<svg ref={svgRef} style={{width: SVG_WIDTH, height: SVG_HEIGHT}}></svg>	
		<svg ref={progSvgRef} style={{width: PROG_SVG_WIDTH, height: PROG_SVG_HEIGHT}}></svg>
	</div>
}

function plotScatter({
	g,
	data,
	x_index,
	y_index,
	scaleX,
	scaleY,
	axisX,
	axisY,
	r = 3,
}) {
	// TODO: using the stroke-end property to draw circles
	g.append('g').attr('class', 'axis-x').call(axisX)
	 .attr('transform', `translate(${[0, scaleY.range()[0]]})`)
	g.append('g').attr('class', 'axis-y').call(axisY)
	//  .attr('transform', `translate(${[0, 0]})`)
	g.selectAll('circle').data(data).join('circle')
	 .attr('cx', d => scaleX(d.f[x_index]))
	 .attr('cy', d => scaleY(d.f[y_index]))
	 .attr('r', r)
	 .attr('opacity', .36)

	
	return {
		update(newData) {
			g.select('.axis-x').call(axisX)
			g.select('.axis-y').call(axisY)
			g.selectAll('circle').data(newData, d => d.hash).join(
				enter => enter.append('circle')
					.attr('cx', d => scaleX(d.f[x_index]))
					.attr('cy', d => scaleY(d.f[y_index]))
					.attr('opacity', .36)
					.attr('r', r),
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
	data,
	width,
	height,
	gap,
	labels,
	groupIds,
}) {
	const LABEL_SIZE = 14

	const prop_num = data[0].f.length
	const scp_width = (width - gap * (prop_num - 2)) / (prop_num - 1)
	const scp_height = (height- gap * (prop_num - 2)) / (prop_num - 1)
	const extents = [...Array(prop_num).keys()].map(k => d3.extent(
		data.map(d => d.f[k])
	))
	const scale_xs = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().range([0, scp_width]).domain(extents[k])
	)
	const scale_ys = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().range([scp_height, 0]).domain(extents[k])
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
				g: scp_g,
				data,
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
		labels.slice(1).forEach((label, idx) => 
			g.append('text').text(label)
			 .attr('transform', `translate(${(scp_width + gap)*(idx - 1) + scp_width/2})`)
			 .attr('text-anchor', 'middle')
			 .style('font-size', LABEL_SIZE)
		)
	})

	g.append('g').attr('class', 'label-y')
	 .attr('transform', `translate(${width + LABEL_SIZE*1.5})`)
	 .call(g => {
		labels.slice(0, -1).forEach((label, idx) => 
			g.append('text').text(label)
			.attr('text-anchor', 'middle')
			.style('transform-box', 'fill-box')
			.style('transform-origin', 'bottom center')
			.style('font-size', LABEL_SIZE)
			.attr('transform', `translate(${[0, (scp_height + gap)*idx + scp_height/2]}) rotate(90)`)
	 )
	})

	return {
		update(newData) {
			const newExtents = [...Array(prop_num).keys()].map(k => d3.extent(
				newData.map(d => d.f[k])
			))
			scale_xs.forEach((scaleX, idx) => scaleX.domain(newExtents[idx]))
			scale_ys.forEach((scaleY, idx) => scaleY.domain(newExtents[idx]))
			scatters.forEach(scatter => scatter.update(newData))
		}
	}
}

export function plotParallelCoord({
	g,
	data,
	height,
	width,
	labels
}) {
	const tick_size = 3
	const prop_num = data[0].f.length
	const gap = (width - tick_size) / (prop_num - 1)
	const margin_top = 20
	const font_size = 14
	const scale_ys = [...Array(prop_num).keys()].map(
		k => d3.scaleLinear().domain(
			d3.extent(data.map(d => d.f[k]))
		).range([height, margin_top])
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

	const lines_g = g.append('g')
	lines_g.selectAll('path').data(data, d => d.hash).join('path')
		.attr('d', d => line(d.f))
		.attr('class', 'line')


	return {
		update (new_data) {
			scale_ys.forEach((s, idx) => s.domain(
				d3.extent(new_data.map(d => d.f[idx]))
			))
			g.selectAll('.axis')
			 .each(function (_, idx) {
				d3.select(this).call(axes[idx])
			 })
			lines_g.selectAll('path').data(new_data, d => d.hash).join(
				enter => enter.append('path').attr('d', d => line(d.f)).attr('class', 'line'),
				update => update.transition().duration(100).attr('d', d => line(d.f)),
				exit => exit.remove()
			)
		},
	}
}

export function plotProgress({
	g,
	data : da,
	width,
	height
}) {
	const data = [...da]
	let upperYDomain = Math.ceil(d3.max(data) * 1.2)

	const scaleY = d3.scaleLinear().domain([0, upperYDomain]).range([height, 0])
	const scaleX = d3.scaleLinear().domain([1, da.length + 10]).range([0, width])
	const axisY = d3.axisLeft(scaleY)
	const axisX = d3.axisBottom(scaleX)

	const gy = g.append('g').call(axisY)
	const gx = g.append('g').attr('transform', `translate(${[0, height]})`).call(axisX)

	const line = d3.line().x((d, i) => scaleX(i + 1)).y(scaleY)
	const path = g.append('path').datum(data).attr('d', line)
		.style('stroke', 'black')
		.style('stroke-width', 1)
		.style('fill', 'none')
	return {
		update({
			newData: da
		}) {
			data.push(...da)
			const rounds = data.length
			const upperXDomain = scaleX.domain()[1]
			const maxD = d3.max(da)

			if (rounds >= upperXDomain) {
				scaleX.domain([0, Math.ceil(upperXDomain * 1.4)])
				gx.call(axisX)
			}

			if (maxD > upperYDomain) {
				upperYDomain = Math.ceil(maxD * 1.2)
				scaleY.domain([0, upperYDomain])
				gy.call(axisY)
			}

			path.transition().duration(50).attr('d', line)
		}
	}
}


