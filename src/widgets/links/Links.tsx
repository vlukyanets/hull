import { useRef, useState } from "preact/hooks"
import {
  addGroup,
  addLink,
  moveGroup,
  moveLink,
  removeGroup,
  removeLink,
  renameGroup,
  setLink,
  type Place,
} from "../../config"
import type { WidgetProps } from "../props"
import { GroupDialog } from "./GroupDialog"
import { tileHref } from "./href"
import { firstLetter } from "./letter"
import { LinkDialog } from "./LinkDialog"

// The dialog open in edit mode: a link of a group (no index to add one),
// or a group (none to add one).
type Open = { link: true; group: number; index?: number } | { link: false; group?: number }

// What is being dragged.
type Dragged = { link: true; at: Place } | { link: false; group: number }

// Firefox starts a drag only with data; a type of hull's own keeps the
// browser from opening it when it is dropped elsewhere.
const DRAG_TYPE = "application/x-hull"

function Plus({ size }: { size: number }) {
  return (
    <svg class="plus" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function Links({ config, editing, save }: WidgetProps) {
  const [open, setOpen] = useState<Open>()
  const [over, setOver] = useState<string>()
  const [source, setSource] = useState<string>()
  const dragged = useRef<Dragged>(undefined)

  if (!editing) {
    return (
      <section class="links">
        {config.groups.map((group, g) => (
          <section class="group" key={g}>
            <h2 class="group-name">{group.name}</h2>
            <ul class="tiles">
              {group.links.map((link, i) => (
                <li key={i}>
                  <a class="tile" href={tileHref(link.url)}>
                    <span class="tile-letter" aria-hidden="true">
                      {firstLetter(link.name)}
                    </span>
                    <span class="tile-name">{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    )
  }

  // key marks the dragged one, drawn hollow where it was.
  function drag(what: Dragged, key: string, label: string) {
    return (event: DragEvent) => {
      dragged.current = what
      event.dataTransfer?.setData(DRAG_TYPE, label)
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
      // After the browser has taken its picture of it for the drag, or
      // the picture would be hollow too.
      setTimeout(() => setSource(key))
    }
  }

  function dragEnd() {
    dragged.current = undefined
    setOver(undefined)
    setSource(undefined)
  }

  // A group dropped on another takes its place: before it when it comes
  // from below, after it when it comes from above; the bar shows which.
  function groupClass(g: number) {
    const what = dragged.current
    let name = "group"
    if (source === `group ${g}`) name += " dragging"
    if (over === `group ${g}`) {
      name += what && !what.link && what.group < g ? " over-after" : " over-before"
    }
    return name
  }

  const tileClass = (key: string, extra = "") =>
    `tile${extra}${over === key ? " over" : ""}${source === key ? " dragging" : ""}`

  // A drop target for links (link true) or groups; key marks it while a
  // drag is over it.
  function target(link: boolean, key: string, drop: (what: Dragged) => void) {
    return {
      onDragOver(event: DragEvent) {
        if (dragged.current?.link !== link) return
        event.preventDefault()
        setOver(key)
      },
      onDragLeave() {
        setOver(undefined)
      },
      onDrop(event: DragEvent) {
        const what = dragged.current
        if (what?.link !== link) return
        event.preventDefault()
        dragEnd()
        drop(what)
      },
    }
  }

  // A drop on the place it came from changes nothing.
  const dropLink = (to: Place) => (what: Dragged) => {
    if (!what.link || (what.at.group === to.group && what.at.index === to.index)) return
    save(moveLink(config, what.at, to))
  }
  const dropGroup = (to: number) => (what: Dragged) => {
    if (!what.link && what.group !== to) save(moveGroup(config, what.group, to))
  }

  return (
    <section class="links editing">
      {config.groups.map((group, g) => (
        <section class={groupClass(g)} key={g} {...target(false, `group ${g}`, dropGroup(g))}>
          <h2 class="group-name">
            <button
              type="button"
              draggable
              onDragStart={drag({ link: false, group: g }, `group ${g}`, group.name)}
              onDragEnd={dragEnd}
              onClick={() => setOpen({ link: false, group: g })}
            >
              <svg class="grip" aria-hidden="true" width="12" height="16" viewBox="0 0 12 16">
                <circle cx="3" cy="3" r="1.4" />
                <circle cx="9" cy="3" r="1.4" />
                <circle cx="3" cy="8" r="1.4" />
                <circle cx="9" cy="8" r="1.4" />
                <circle cx="3" cy="13" r="1.4" />
                <circle cx="9" cy="13" r="1.4" />
              </svg>
              {group.name}
            </button>
          </h2>
          <ul class="tiles">
            {group.links.map((link, i) => (
              <li key={i}>
                <button
                  type="button"
                  class={tileClass(`link ${g} ${i}`)}
                  draggable
                  onDragStart={drag(
                    { link: true, at: { group: g, index: i } },
                    `link ${g} ${i}`,
                    link.name,
                  )}
                  onDragEnd={dragEnd}
                  onClick={() => setOpen({ link: true, group: g, index: i })}
                  {...target(true, `link ${g} ${i}`, dropLink({ group: g, index: i }))}
                >
                  <span class="tile-letter" aria-hidden="true">
                    {firstLetter(link.name)}
                  </span>
                  <span class="tile-name">{link.name}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                class={tileClass(`end ${g}`, " tile-add")}
                aria-label={`Add a link to ${group.name}`}
                onClick={() => setOpen({ link: true, group: g })}
                {...target(true, `end ${g}`, dropLink({ group: g, index: group.links.length }))}
              >
                <span class="tile-letter" aria-hidden="true">
                  <Plus size={20} />
                </span>
                <span class="tile-name">Add link</span>
              </button>
            </li>
          </ul>
        </section>
      ))}
      <button
        type="button"
        class={`group-add${over === "group end" ? " over-before" : ""}`}
        onClick={() => setOpen({ link: false })}
        {...target(false, "group end", dropGroup(config.groups.length))}
      >
        <Plus size={16} />
        Group
      </button>
      {open && dialog(open)}
    </section>
  )

  function dialog(open: Open) {
    const close = () => setOpen(undefined)
    if (open.link) {
      const { group, index } = open
      if (index === undefined) {
        return <LinkDialog onSave={(link) => save(addLink(config, group, link))} onClose={close} />
      }
      const at = { group, index }
      return (
        <LinkDialog
          link={config.groups[group].links[index]}
          onSave={(link) => save(setLink(config, at, link))}
          onRemove={() => save(removeLink(config, at))}
          onClose={close}
        />
      )
    }
    const { group } = open
    if (group === undefined) {
      return <GroupDialog onSave={(name) => save(addGroup(config, name))} onClose={close} />
    }
    return (
      <GroupDialog
        group={config.groups[group]}
        onSave={(name) => save(renameGroup(config, group, name))}
        onRemove={() => save(removeGroup(config, group))}
        onClose={close}
      />
    )
  }
}
