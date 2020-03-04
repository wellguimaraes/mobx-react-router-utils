import { RouterStore } from 'mobx-react-router'

let _routingStore: RouterStore
export const setRoutingStore = (routingStore: RouterStore) => (_routingStore = routingStore)
export const getRoutingStore = () => _routingStore