// Copyright (c) 2018 Träger

// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

'use strict'

const api = require('velux-klf200-api')
const debug = require('debug')('velux-klf200:base')
const nodes = require('./nodes')
const events = require('events');

var intern ={}

function setTime(){
  return new Promise((resolve, reject)=>{
    debug('setTime')
    api.sendCommand({api: api.API.GW_SET_UTC_REQ,
                     utcTimeStamp: new Date()})
    .then((data)=>{
      debug('setTime:',data)
      resolve()
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

function getState(system){
  return new Promise((resolve, reject)=>{
    debug('getState')
    api.sendCommand({api: api.API.GW_GET_STATE_REQ})
    .then((data)=>{
      debug('getState:',data)
      system.state = Object.assign({},data)
      resolve()
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

function getVersion(system){
  return new Promise((resolve, reject)=>{
    debug('getVersion')
    api.sendCommand({api: api.API.GW_GET_VERSION_REQ})
    .then((data)=>{
      debug('getVersion:',data)
      system.version = Object.assign({},data)
      resolve()
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

function getProtocolVersion(system){
  return new Promise((resolve, reject)=>{
    debug('getProtocolVersion')
    api.sendCommand({api: api.API.GW_GET_PROTOCOL_VERSION_REQ})
    .then((data)=>{
      debug('getProtocolVersion:',data)
      system.ProtocolVersion = Object.assign({},data)
      resolve()
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

function HouseStatusMonitorEnable(){
  return new Promise((resolve, reject)=>{
    debug('HouseStatusMonitorEnable')
    api.sendCommand({api: api.API.GW_HOUSE_STATUS_MONITOR_ENABLE_REQ})
    .then((data)=>{
      debug('HouseStatusMonitorEnable:',data)
    })
    .catch((err)=>{
      resolve(err)
    })
  })
}


/*  getVelux
      generates an communication object

      host                    : ipadress ov the KLF-200
      password                : password for the connect
      options.nodes           [default true]  : generate an nodes object
      options.groups          [default true]  : generate an groups object
      options.scenes          [default true]  : generate an scenes object
      options.inputs          [default false] : generate an inputs object
      options.activationLog   [default false] : generate an activationLog object
      options.liveCycle       [default 600000] : Time for the LiveCycle must less then 15 minutes
      options.api             : options for the velux-klf200-api
*/
function getVelux(host,password,options) { 
  return new Promise((resolve, reject)=>{
    var velux = {
      api: api, 
      system: {}, 
      event: new events.EventEmitter(),
    }
    if (typeof options === 'undefined') options = {}
    if (typeof options.nodes === 'undefined') {options.nodes = true
    debug('options.nodes',options.nodes)}
    if (typeof options.groups === 'undefined') options.groups = true
    if (typeof options.scenes === 'undefined') options.scenes = true
    if (typeof options.inputs === 'undefined') options.inputs = false
    if (typeof options.scactivationLog === 'undefined') options.activationLog = false
    if (typeof options.liveCycle === 'undefined') options.liveCycle = 600000
    debug('getVelux','host',host,'options',options)

    api.end().then(()=> {
      intern.startTimer = setTimeout(()=>{
        var error = new Error('Start timeout reset the klf-200 please')
        reject(error)
      },30000)
      return api.connect(host,{})
    }).then(()=>{
      debug('KLF200 connected')
      clearTimeout(intern.startTimer)
      return api.login(password)
    }).then(()=>{
      debug('KLF200 logged in')
      return setTime()
    }).then(()=>{
      return getState(velux.system)
    }).then(()=>{
      return getVersion(velux.system)
    }).then(()=>{
      return getProtocolVersion(velux.system)
    }).then(()=>{
      if (options.nodes) {
        return nodes.getNodes(api)
      }
    }).then((nodes)=>{
      if (options.nodes) {
        velux.nodes = nodes
      }
      return HouseStatusMonitorEnable()
    }).then((nodes)=>{
      intern.liveCycle = setInterval(()=>{
        getState(velux.system).catch((err)=>{
          debug('LiveCycle', err)
          api.end()
          velux.event.emit('error',err)
        })
      },options.liveCycle)
      resolve(velux)
    }).catch((err)=>{
      clearTimeout(intern.startTimer)
      clearTimeout(intern.liveCycle)
      api.end()
      debug('KLF200 error',err)
      reject(err)
    })
    
    velux.end = function () {
      clearTimeout(intern.startTimer)
      clearTimeout(intern.liveCycle)
      
      return api.end()
    }
  })
}
exports.getVelux = getVelux


