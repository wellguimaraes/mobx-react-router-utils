# MobX React Router Utils
Routing utils to use with RouterStore (from `mobx-react-router`) on your MobX stores.

## Install it
```
yarn add mobx-react-router-utils
``` 

## Use it
```typescript
import { computedRouteParam, setRoutingStore } from 'mobx-react-router-utils'

// Set the reference to your routing store before any usage
// You ony need to this once in your application 
setRoutingStore(routingStore)

const routes = {
  search: '/search',
  citySearch: '/cities/:city'
}

class DemoSearchStore {
    city = computedRouteParam('city', {
      patterns: [routes.citySearch],
    })
    
    checkIn = computedRouteParam('checkIn', {
      // Define the matching patterns
      patterns: [routes.search, routes.citySearch],
      
      // Set a parsing fn to transform from string
      parse: _parseDate,
      
      // Set a formatting fn to transform into string
      format: _formatDate, 

      // It'll return the default value in case it's 
      // not present on the route or with an empty value
      defaultValue: 'temecula'
    })
    
    checkOut = computedRouteParam('checkOut', {
      patterns: [routes.search, routes.citySearch],
      parse: _parseDate,
      format: _formatDate,
    })
    
    setRegion = (city: Maybe<string>) => {
      // For updating the current route, push() and replace() methods are available:
      // - push: will add the new url to the browsing history
      // - replace: will replace the current url on the browsing history
      this.city.push(city, {
        // enforce a route pattern if needed, otherwise, it will use the 
        // current location (if matches the config) or first pattern available
        pattern: !city && routes.search,
        
        // cleanup all other params (default: false)
        cleanParams: true,  
              
        // OR cleanup only selected params
        cleanParams: [   
          this.checkIn, 
          this.checkOut
        ]
      })
    }
    
    setPeriod = (checkIn: Maybe<Date>, checkOut: Maybe<Date>) => {
      this.checkIn.push(checkIn)
      this.checkOut.replace(checkOut)
    }

    // ...
}
```
