import { Controller } from '@hotwired/stimulus'
import { method, camelize } from '../support/index'
import { render, h } from '@luwes/little-vdom'
import { useValues } from './values'

export interface RenderOptions {
  defaultContent?: any
}

const defaultOptions: RenderOptions = {
  defaultContent: (controller: string) => (
    <div>
      Default content for <span style={{ background: "lightgray", padding: "2px", color: "black", }}>{controller}</span> Controller
    </div>
  )
}

class RenderController extends Controller {
  declare __render: () => void
  declare __rerender: () => void
  declare state: () => Object
  declare values: () => Object
}

export const useRender = (controller: RenderController, options: RenderOptions = {}) => {
  const { defaultContent } = Object.assign({}, defaultOptions, options)

  if (!controller) {
    console.error("Make sure you pass in `this` to `useRender(this)` in your Stimulus Controller.")
    return
  }

  useValues(controller)

  const constructor = controller.constructor as any
  // const controllerConnect = controller.connect.bind(controller)
  // const controllerDisconnect = controller.disconnect.bind(controller)

  const renderMethod = method(controller, 'render')

  Object.assign(controller, {
    __rerender() {
      this.__render()
      console.info("re-render", controller.values())
    },

    __render() {
      let content = null

      if (renderMethod) {
        content = renderMethod.call(controller)
      } else {
        content = defaultContent(controller.identifier)
      }

      render(content, controller.element)
    }
  })

  Object.keys(constructor.values).forEach((value) => {
    const methodName = camelize(`${value}ValueChanged`)
    const originalMethod = method(controller, methodName)

    const assignments: { [key: string]: Function } = {}

    if (originalMethod) {
      assignments[methodName] = (...params: any) => {
        originalMethod.call(controller, ...params)
        controller.__rerender()
      }
    } else {
      assignments[methodName] = () => {
        controller.__rerender()
      }
    }

    Object.assign(controller, assignments)
  })

  controller.__render()
}
