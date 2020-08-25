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
const scenes = require('./scenes')
const events = require('events')

var intern ={}

exports.API = api.API

function callApi(apiCall){
  return new Promise((resolve, reject)=>{
    debug('callApi:',apiCall)
    api.sendCommand(apiCall)
    .then((data)=>{
      debug('callApi:',data)
      resolve(data)
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

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
      resolve();
    })
    .catch((err)=>{
      reject(err)
    })
  })
}

function HouseStatusMonitorDisable(){
  return new Promise((resolve, reject)=>{
    debug('HouseStatusMonitorDisable')
    api.sendCommand({api: api.API.GW_HOUSE_STATUS_MONITOR_DISABLE_REQ})
    .then((data)=>{
      debug('HouseStatusMonitorDisable:',data)
      resolve();
    })
    .catch((err)=>{
      reject(err)
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
      callAPI: callApi,
      event: new events.EventEmitter()
    }
    if (typeof options === 'undefined') options = {}
    if (typeof options.nodes === 'undefined') options.nodes = true
    if (typeof options.groups === 'undefined') options.groups = true
    if (typeof options.scenes === 'undefined') options.scenes = true
    if (typeof options.inputs === 'undefined') options.inputs = false
    if (typeof options.scactivationLog === 'undefined') options.activationLog = false
    if (typeof options.liveCycle === 'undefined') options.liveCycle = 300000
    if (typeof options.houseStatusMonitorEnable === 'undefined') options.houseStatusMonitorEnable = true
    if (typeof options.startTimeout === 'undefined') options.startTimeout = 30000
    debug('getVelux','host',host,'options',options)

    api.end().then(()=> {
      intern.startTimer = setTimeout(()=>{
        velux.end()
        var error = new Error('Start timeout reset the klf-200 please')
        reject(error)
      },options.startTimeout)
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
      if (options.nodes) return nodes.getNodes(velux)
      return new Promise((resolve, reject)=>{resolve()})
    }).then((nodes)=>{
      if (typeof nodes !== "undefined") velux.nodes = nodes
      if (options.scenes) return scenes.getScenes(velux)
      return new Promise((resolve, reject)=>{resolve()})
    }).then((scenes)=>{
      if (typeof scenes !== "undefined") velux.scenes = scenes
      if (options.nodes) { 
        if (options.houseStatusMonitorEnable) return HouseStatusMonitorEnable()
        return HouseStatusMonitorDisable()
      }
      return new Promise((resolve, reject)=>{resolve()})
    }).then(()=>{
      debug('liveCycle',options.liveCycle)
      intern.liveCycle = setInterval(()=>{
        getState(velux.system).catch((err)=>{
          debug('LiveCycle', err)
          velux.event.emit('error',err)
          velux.end()
        })
      },options.liveCycle)
      resolve(velux)
    }).catch((err)=>{
      velux.end()
      debug('KLF200 error',err)
      reject(err)
    })

    api.on('GW_ERROR_NTF',(data)=>{
      debug('velux.on GW_ERROR_NTF',data)
      var error = new Error(data.error)
      velux.event.emit('error',error)
      if (data.errorNumber == 12 || data.errorNumber == 0) {
        velux.end()
      }
    })

    api.on('NTF',(data)=>{
      debug('velux.on NTF',data)
      velux.event.emit('NTF',data)
    })

    api.on('GW_COMMAND_REMAINING_TIME_NTF',(data)=>{
      debug('velux.on GW_COMMAND_REMAINING_TIME_NTF',data)
      velux.event.emit('GW_COMMAND_REMAINING_TIME_NTF',data)
    })

    api.on('GW_COMMAND_RUN_STATUS_NTF',(data)=>{
      debug('velux.on GW_COMMAND_RUN_STATUS_NTF',data)
      velux.event.emit('GW_COMMAND_RUN_STATUS_NTF',data)
    })

    api.on('GW_SESSION_FINISHED_NTF',(data)=>{
      debug('velux.on GW_SESSION_FINISHED_NTF',data)
      velux.event.emit('GW_SESSION_FINISHED_NTF',data)
    })
    
    velux.end = function () {
      debug('end')
      clearTimeout(intern.startTimer)
      clearInterval(intern.liveCycle)
      velux.event.emit('end')
      return api.end()
    }
  })
}
exports.getVelux = getVelux


