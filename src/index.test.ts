import { brief } from './index'

beforeEach(() => {
  for (let i = 0; i < 10; i++) {
    const node = document.createElement('div')
    node.setAttribute('data-index', `${i}`)

    node.appendChild(document.createElement('p'))

    document.body.appendChild(node)
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('brief', () => {
  it('can make a blank brief', () => {
    expect(brief().length).toBe(0)
  })
  it('can be created with just a selector', () => {
    expect(brief('body').length).toEqual(1)
  })
  it('can accept a context', () => {
    expect(brief('p', 'div:first-child').length).toEqual(1)
  })
})

describe('toArray', () => {
  it('converts to a regular array', () => {
    expect(brief('div').toArray().length).toEqual(10)
  })
})

describe('push', () => {
  it('it works with a brief object', () => {
    const x = brief('body')
    const y = brief('div')

    expect(x.length).toEqual(1)

    const z = x.push(y)

    expect(z.length).toEqual(11)
  })
  it('works with an HTMLElement[]', () => {
    const x = brief('body')
    const y = brief('div').toArray()

    expect(x.length).toEqual(1)

    const z = x.push(y)

    expect(z.length).toEqual(11)
  })
  it('works with an HTMLElement', () => {
    const x = brief('body')
    const y = brief('div').toArray()[0]

    expect(x.length).toEqual(1)

    const z = x.push(y)

    expect(z.length).toEqual(2)
  })
})

describe('filter', () => {
  it('can filter a selector', () => {
    const x = brief('div')

    expect(x.length).toEqual(10)

    const y = x.filter('div:first-child')

    expect(y.length).toEqual(1)
  })
  it('can filter with a function', () => {
    const x = brief('div')

    expect(x.length).toEqual(10)

    const y = x.filter((element, i) => i === 1 || i === 2)

    expect(y.length).toEqual(2)
  })
})

describe('find', () => {
  it('can find', () => {
    const x = brief('div:first-child')

    expect(x.length).toEqual(1)

    const y = x.find('p')

    expect(y.length).toEqual(1)
    expect(y.toArray()[0].tagName).toEqual('P')
  })
})

describe('forEach', () => {
  it('runs once per element', () => {
    const x = brief('div')
    let i = 0

    x.forEach((element, index) => {
      expect(element.matches(`div:nth-of-type(${i + 1})`)).toEqual(true)
      expect(index).toEqual(i)

      i = i + 1
    })

    expect(i).toEqual(10)
  })
})

describe('children', () => {
  it('finds children', () => {
    const x = brief('div')

    expect(x.length).toEqual(10)

    x.forEach(element => {
      expect(element.matches('div'))
    })

    x.children()

    expect(x.length).toEqual(10)

    x.forEach(element => {
      expect(element.matches('p'))
    })
  })
})

describe('map', () => {
  it('converts the brief into a map', () => {
    const x = brief('div')

    const y = x.map((element, index) => {
      return `${element.tagName}${index}`
    })

    y.forEach((str, index) => {
      expect(str).toEqual(`DIV${index}`)
    })
  })
})

describe('getAttribute', () => {
  it('can get an attribute', () => {
    const x = brief('div')

    const y = x.getAttribute('data-index')

    y.forEach((el, index) => {
      expect(el).toEqual(`${index}`)
    })
  })
})

describe('setAttribute', () => {
  it('can set an attribute', () => {
    const x = brief('div')

    x.forEach(el => {
      expect(el.getAttribute('data-new-attr')).toEqual(null)
    })

    x.setAttribute('data-new-attr', 'myvalue')

    x.forEach(el => {
      expect(el.getAttribute('data-new-attr')).toEqual('myvalue')
    })
  })
})

describe('removeAttribute', () => {
  it('can remove an attribute', () => {
    const x = brief('div')

    x.setAttribute('data-new-attr', 'myvalue')

    x.forEach(el => {
      expect(el.getAttribute('data-new-attr')).toEqual('myvalue')
    })

    x.removeAttribute('data-new-attr')

    x.forEach(el => {
      expect(el.getAttribute('data-new-attr')).toEqual(null)
    })
  })
})

describe('empty', () => {
  it('empties', () => {
    const x = brief('div')

    expect(x.length).toEqual(10)

    // This is a private method so Typescript thinks I shouldn't call it
    // @ts-ignore
    const y = x.empty()

    expect(y.length).toEqual(0)
  })
})

describe('indexOf', () => {
  it('finds the right element with a selector', () => {
    const x = brief('div')

    expect(x.length).toEqual(10)

    const y = x.indexOf('div:first-child')

    expect(y).toEqual(0)
  })
})

describe('fireEvent', () => {
  it('can fire an event', () => {
    let clicked = false

    document.querySelector('body')!.addEventListener('click', () => {
      clicked = true
    })

    brief('body').fireEvent(new MouseEvent('click'))

    expect(clicked).toEqual(true)
  })
})

describe('on', () => {
  it('adds an event listener', () => {
    let clicked = false

    const x = brief('body')

    x.on('click', () => (clicked = true))

    x.fireEvent(new MouseEvent('click'))

    expect(clicked).toEqual(true)
  })
})

describe('once', () => {
  it('adds an event listener and removes it after the first invocation', () => {
    let numberOfClicks = 0
    const x = brief('body')

    x.once('click', () => {
      numberOfClicks = numberOfClicks + 1
    })

    x.fireEvent(new MouseEvent('click'))
    x.fireEvent(new MouseEvent('click'))

    expect(numberOfClicks).toEqual(1)
  })
})

describe('off', () => {
  it('removes an event listener', () => {
    let numberOfClicks = 0
    const x = brief('body')
    function onClick() {
      numberOfClicks = numberOfClicks + 1
    }

    x.on('click', onClick)

    x.fireEvent(new MouseEvent('click'))
    x.fireEvent(new MouseEvent('click'))

    expect(numberOfClicks).toEqual(2)

    x.off('click', onClick)

    x.fireEvent(new MouseEvent('click'))

    expect(numberOfClicks).toEqual(2)
  })
})
