import { useContext } from "react";
import { DataContext } from "../context/DataContext";

export default function useData() {
	return useContext(DataContext)
}