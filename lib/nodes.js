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

const debug = require('debug')('velux-klf200:nodes')

/*  getNodes
      generates an communication object

      velux                   : the connected API Object
      
      
*/
function getNodes(velux) { 
  return new Promise((resolve, reject)=>{
    var intern = {}
    var nodes = {node: [],}
    
    nodes.getAllNodesInformation = function(){
      return new Promise((resolve, reject)=>{
        debug('getAllNodesInformation')
        velux.once('GW_GET_ALL_NODES_INFORMATION_FINISHED_NTF',()=>{
          resolve()
        })
        velux.sendCommand({api: velux.API.GW_GET_ALL_NODES_INFORMATION_REQ})
        .then((data)=>{
          debug('getAllNodesInformation:',data)
          if (!data.status) {
            var error = new Error("Can't get node information")
            reject(error)
          }
        })
        .catch((err)=>{
          reject(err)
        })
      })
    }

    nodes.getNodeInformation = function(index){
      return new Promise((resolve, reject)=>{
        debug('getAllNodesInformation')
        velux.sendCommand({api: velux.API.GW_GET_NODE_INFORMATION_REQ, nodeID: index})
        .then((data)=>{
          debug('getAllNodesInformation:',data)
          if (data.status==0) {
            resolve(data.nodeID)
          } else {
            var error = new Error(data.statusText)
            reject(error)
          }
        })
        .catch((err)=>{
          reject(err)
        })
      })
    }

    velux.on('GW_GET_ALL_NODES_INFORMATION_NTF',(data)=>{
      debug('velux.on GW_GET_ALL_NODES_INFORMATION_NTF',data)
      nodes.node[data.nodeID]=Object.assign({},data)
    })

    velux.on('GW_GET_NODE_INFORMATION_NTF',(data)=>{
      debug('velux.on GW_GET_ALL_NODES_INFORMATION_NTF',data)
      nodes.node[data.nodeID]=Object.assign({},data)
    })
    
    velux.on('GW_NODE_STATE_POSITION_CHANGED_NTF',(data)=>{
      debug('velux.on GW_NODE_STATE_POSITION_CHANGED_NTF',data)
      if (nodes.node[data.nodeID]) {
        nodes.node[data.nodeID]=Object.assign(node.veluxNode[data.nodeID],data)
        velux.event.emit('nodeUpdate',data.nodeID)
      } else if (intern.started) {
        nodes.getNodeInformation(data.nodeID)
        .then(()=>{velux.event.emit('nodeUpdate',data.nodeID)})
        .catch((err)=>{velux.event.emit('error',err)})
      }
    })
    
    nodes.getAllNodesInformation()
    .then(()=>{
      intern.started = true,
      resolve(nodes)
    }).catch((err)=>{reject(err)})
  })
}
exports.getNodes = getNodes
