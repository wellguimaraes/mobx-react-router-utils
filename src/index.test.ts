import { computedRouteParam } from './index'
import { setRoutingStore } from './index'
import sinon, { SinonSpy } from 'sinon'
import { expect } from 'chai'

function createRoutingStore({
  push,
  replace,
  pathname,
  search,
}: {
  push: SinonSpy
  replace: SinonSpy
  pathname: string
  search: string
}) {
  return {
    location: {
      pathname,
      search,
      hash: '',
    },
    history: {
      push,
      replace,
    },
    push,
    replace,
  } as any
}

describe('computedRouteParam', () => {
  it('cleaning params', async () => {
    let push = sinon.spy()
    let replace = sinon.spy()

    setRoutingStore(createRoutingStore({ pathname: '/', search: '?y=ipsum', push, replace }))

    const x = computedRouteParam.int('x', { patterns: ['/', '/:z'] })
    const y = computedRouteParam('y', { patterns: ['/', '/:z'] })
    const z = computedRouteParam('z', { patterns: ['/:z'] })

    x.push(15, { cleanParams: [y] })

    const updatedRoute = await z.push('zzz')

    expect(updatedRoute).to.equal('/zzz?x=15')
    expect(push.calledOnce).to.be.true
  })

  it('enforce new route pattern', async () => {
    let push = sinon.spy()
    let replace = sinon.spy()

    setRoutingStore(createRoutingStore({ pathname: '/temecula', search: '?x=15&y=lorem', push, replace }))

    const x = computedRouteParam.int('x', { patterns: ['/', '/:z?'] })
    const z = computedRouteParam('z', { patterns: ['/:z?'] })

    const secondRoute = await z.push(null, {
      enforcePattern: '/',
      cleanParams: [x],
    })

    expect(secondRoute).to.equal('/?y=lorem')
  })
})
