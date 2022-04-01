import { memo } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Icon from "../../components/Icon"
import styles from "./Sortable.module.scss"

interface ItemProps {
  id: string
  content: string
}

const Item = ({ item, index }: { item: ItemProps; index: number }) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div
          className={styles.item}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {item.content}
          <Icon name="DragHandle" />
        </div>
      )}
    </Draggable>
  )
}

const List = memo(({ list }: { list: ItemProps[] }) => {
  return (
    <div className={styles.list}>
      {list.map((item: ItemProps, index: number) => (
        <Item item={item} index={index} key={item.id} />
      ))}
    </div>
  )
})

interface Props {
  list: ItemProps[]
  callback: (list: ItemProps[]) => void
}

const Sortable = ({ list, callback }: Props) => {
  return (
    <DragDropContext
      onDragEnd={(result) => {
        if (!result.destination) return
        if (result.destination.index === result.source.index) return
        callback(reorder(list, result.source.index, result.destination.index))
      }}
    >
      <Droppable droppableId="list">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <List list={list} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default Sortable

/* utils */
function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}
