import type { Config } from "../../config"
import { tileHref } from "./href"
import { firstLetter } from "./letter"

export function Links({ config }: { config: Config }) {
  return (
    <section class="links">
      {config.groups.map((group, i) => (
        <section class="group" key={i}>
          <h2 class="group-name">{group.name}</h2>
          <ul class="tiles">
            {group.links.map((link, j) => (
              <li key={j}>
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
