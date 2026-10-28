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

export function Links({ config, editing, save }: WidgetProps) {
  const [open, setOpen] = useState<Open>()
  const [over, setOver] = useState<string>()
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

  function drag(what: Dragged, label: string) {
    return (event: DragEvent) => {
      dragged.current = what
      event.dataTransfer?.setData(DRAG_TYPE, label)
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
    }
  }

  function dragEnd() {
    dragged.current = undefined
    setOver(undefined)
  }

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
        <section
          class={`group${over === `group ${g}` ? " over" : ""}`}
          key={g}
          {...target(false, `group ${g}`, dropGroup(g))}
        >
          <h2 class="group-name">
            <button
              type="button"
              draggable
              onDragStart={drag({ link: false, group: g }, group.name)}
              onDragEnd={dragEnd}
              onClick={() => setOpen({ link: false, group: g })}
            >
              {group.name}
            </button>
          </h2>
          <ul class="tiles">
            {group.links.map((link, i) => (
              <li key={i}>
                <button
                  type="button"
                  class={`tile${over === `link ${g} ${i}` ? " over" : ""}`}
                  draggable
                  onDragStart={drag({ link: true, at: { group: g, index: i } }, link.name)}
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
                class={`tile tile-add${over === `end ${g}` ? " over" : ""}`}
                aria-label={`Add a link to ${group.name}`}
                onClick={() => setOpen({ link: true, group: g })}
                {...target(true, `end ${g}`, dropLink({ group: g, index: group.links.length }))}
              >
                <span class="tile-letter" aria-hidden="true">
                  +
                </span>
                <span class="tile-name">Add</span>
              </button>
            </li>
          </ul>
        </section>
      ))}
      <button
        type="button"
        class={`group-add${over === "group end" ? " over" : ""}`}
        onClick={() => setOpen({ link: false })}
        {...target(false, "group end", dropGroup(config.groups.length))}
      >
        + Group
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
