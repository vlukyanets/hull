import { render } from "preact"
import { loadConfig } from "../config"
import { App } from "./App"
import "./style.css"

render(<App config={loadConfig()} />, document.getElementById("app")!)
