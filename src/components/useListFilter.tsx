import { useState } from "react"
import { Item } from "../data/list"
import Search from "./Search"
import Select from "./Select"

export interface Sorter {
  label: string
  compare: (a: Item, b: Item) => number
}

const useListFilter = (initial?: string, sorters?: Dictionary<Sorter>) => {
  const [input, setInput] = useState("")
  const [sorter, setSorter] = useState(initial)

  const renderSearch = () => (
    <Search value={input} onChange={(e) => setInput(e.target.value)}>
      {sorters && (
        <Select
          attrs={{
            value: sorter,
            onChange: (e) => setSorter(e.target.value),
            style: { textAlignLast: "right" },
          }}
          options={Object.entries(sorters).map(([key, { label }]) => ({
            value: key,
            children: label,
          }))}
          right
        />
      )}
    </Search>
  )

  return {
    compare: sorter ? sorters?.[sorter]?.compare : () => 0,
    filter: (str: string) => str.toLowerCase().includes(input.toLowerCase()),
    renderSearch,
  }
}

export default useListFilter
