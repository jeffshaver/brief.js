class Brief extends Array {
  context?: string | HTMLElement
  isBrief = true
  length = 0
  selector?: string
  private contextElement?: HTMLElement

  constructor(selector?: string, context?: string | HTMLElement) {
    super()

    this.selector = selector
    this.context = context

    if (selector || context) {
      if (context) {
        if (typeof context === 'string') {
          const contextElement = document.querySelector(context)

          if (contextElement) {
            this.contextElement = contextElement as HTMLElement
          }
        } else {
          this.contextElement = context
        }
      }

      if (selector) {
        super.push(
          ...(this.contextElement || document).querySelectorAll(selector)
        )
      }
    }
  }

  public clone(): Brief {
    const newBrief = brief()

    newBrief.selector = this.selector
    newBrief.context = this.context
    newBrief.contextElement = this.contextElement

    Array.prototype.push.apply(newBrief, this.toArray())

    return newBrief
  }

  public toArray() {
    return [...this]
  }

  // @ts-ignore
  public push(arg: Brief | HTMLElement | HTMLElement[]): Brief {
    const newBrief = this.clone()

    if (argIsBrief(arg)) {
      super.push.apply(newBrief, [...arg])
    } else if (argIsHTMLElement(arg)) {
      super.push.call(newBrief, arg)
    } else {
      super.push.apply(newBrief, arg)
    }

    return newBrief
  }

  // @ts-ignore
  public filter(filter: string | CallBack<boolean>): Brief {
    let newEls

    if (typeof filter === 'string') {
      newEls = Array.prototype.filter.call(this, (element: HTMLElement) =>
        selectorCallback(filter, element)
      )
    } else {
      newEls = Array.prototype.filter.call(
        this,
        (element: HTMLElement, index) =>
          functionFilter(element, filter, index, this)
      )
    }

    const newBrief = this.clone().empty()

    super.push.apply(newBrief, newEls)

    return newBrief
  }

  // .find does not allow the user to provide a Callback because it wouldn't make any sense.
  // Possibly, we could find all children and then filter then with a Callback, but that is probably
  // very bad performance wise, and unwanted most of the time
  // @ts-ignore
  public find(selector: string): Brief {
    let newBrief = this.clone().empty()

    this.forEach(element => {
      super.push.apply(newBrief, brief(selector, element).toArray())
    })

    return newBrief
  }

  // @ts-ignore
  public map<T>(callback: CallBack<T>): T[] {
    return Array.prototype.map.call<Array<T>, any[], T[]>(
      this.toArray(),
      (element: HTMLElement, index: number) => callback(element, index, this)
    )
  }

  public indexOf<T>(selector: string | CallBack<boolean>): number {
    return Array.prototype.findIndex.call<Brief, any[], number>(
      this,
      typeof selector === 'string'
        ? (element: HTMLElement) => selectorCallback(selector, element)
        : selector
    )
  }

  public getAttribute(attribute: string): Nullable<string>[] {
    return this.map(element => element.getAttribute(attribute))
  }

  public setAttribute(attribute: string, value: string): Brief {
    this.forEach(element => {
      element.setAttribute(attribute, value)
    })

    return this
  }

  public removeAttribute(attribute: string): Brief {
    this.forEach(element => {
      element.removeAttribute(attribute)
    })

    return this
  }

  public children() {
    this.find('*')
  }

  public on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => void
  ) {
    this.forEach(element => {
      element.addEventListener(type, listener)
    })
  }

  public fireEvent(event: Event) {
    this.forEach(element => {
      element.dispatchEvent(event)
    })
  }

  public once<K extends keyof HTMLElementEventMap>(
    type: K,
    callback: Function
  ) {
    this.forEach(element => {
      const listenerWrapper = (event: Event) => {
        callback(event)

        element.removeEventListener(type, listenerWrapper)
      }

      element.addEventListener(type, listenerWrapper)
    })
  }

  public off<K extends keyof HTMLElementEventMap>(type: K, callback: Function) {
    this.forEach(element => {
      element.removeEventListener(type, callback)
    })
  }

  private empty() {
    this.length = 0

    return this
  }
}

export const brief = (selector?: string, context?: string | HTMLElement) => {
  return new Brief(selector, context)
}

function selectorCallback(selector: string, element: HTMLElement) {
  return element.matches(selector)
}
function functionFilter(
  element: HTMLElement,
  callback: CallBack<boolean>,
  index: number,
  brief: Brief
) {
  return callback(element, index, brief)
}

type Nullable<T> = T | null
type CallBack<T> = (element: HTMLElement, index: number, brief: Brief) => T
function argIsBrief(possibleBrief: any): possibleBrief is Brief {
  return 'isBrief' in possibleBrief
}
function argIsHTMLElement(
  possibleHTMLElement: any
): possibleHTMLElement is HTMLElement {
  return 'appendChild' in possibleHTMLElement
}
