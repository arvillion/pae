import React, { useState } from "react"

export const DataContext = React.createContext(null)

export function DataProvider() {
	const [data, setData] = useState(null)
	return <DataContext.Provider value={{
		data
	}}>
	</DataContext.Provider>
}