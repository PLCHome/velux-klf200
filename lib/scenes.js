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

const debug = require('debug')('velux-klf200:scenes')

/*  getScenes
      generates an communication object

      velux                   : the connected API Object
      
      
*/
function getScenes(velux) { 
  return new Promise((resolve, reject)=>{
    var intern = {}
    var scenes = {scene: [],}
    
    scenes.getSceneList = function(){
      return new Promise((resolve, reject)=>{
        debug('getSceneList')
        var anzNTF = -1
        var onNTF = (data)=>{
          debug('velux.on GW_GET_SCENE_LIST_NTF',data)
          for (var i = 0; i<data.numberOfObject; i++) {
            scenes.scene[data.sceneListObjects[i].sceneID]=data.sceneListObjects[i]
          }
          
          if (anzNTF <= scenes.scene.length || data.remainingNumberOfObject<1) {
            velux.api.off('GW_GET_SCENE_LIST_NTF',onNTF)
            resolve()
          }
        }
        velux.api.on('GW_GET_SCENE_LIST_NTF',onNTF)
        
        velux.api.sendCommand({api: velux.api.API.GW_GET_SCENE_LIST_REQ})
        .then((data)=>{
          debug('getSceneList:',data)
          anzNTF = data.totalNumberOfObjects
          if (anzNTF<1) {
            velux.api.off('GW_GET_SCENE_LIST_NTF',onNTF)
            var error = new Error("Can't get scene list")
            reject(error)
          }
        })
        .catch((err)=>{
          reject(err)
        })
      })
    }

    scenes.getSceneInformation = function(index){
      return new Promise((resolve, reject)=>{
        debug('getSceneInformation')
        velux.api.sendCommand({api: velux.api.API.GW_GET_SCENE_INFOAMATION_REQ, sceneID: index})
        .then((data)=>{
          debug('getSceneInformation:',data)
          if (data.status==0) {
            resolve(data.sceneID)
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
    
    scenes.getIDs = function(){
      debug('getIDs:')
      return Object.keys(scenes.scene)
    }

    scenes.getScene = function(id){
      debug('getScene:',id)
      return Object.assign({},scenes.scene[id])
    }

    scenes.getSceneName = function(id){
      debug('getSceneName:',id)
      return (scenes.scene[id]||{sceneName:null}).sceneName
    }

    scenes.getIdByName = function(name){
      debug('getIdByName:',name)
      var id = null
      scenes.scene.map((scene)=>{debug('getIdByName:',scene.sceneName,name,scene.sceneName == name)
        if (scene.sceneName == name) id = scene.sceneID})
      return id
    }
    
    scenes.runScene = function (id,velocity){
      return new Promise((resolve, reject)=>{
        debug('runScene: id:',id,'velocity:',velocity)
        var data = {
          api: velux.api.API.GW_ACTIVATE_SCENE_REQ, 
          commandOriginator: 1,
          priorityLevel: 2,
          sceneID: id,
          velocity: velocity
        }
        velux.api.sendCommand(data)
        .then((data)=>{
          debug('runScene:',data)
          if (data.status==0) {
            resolve(data)
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
    
    velux.api.on('GW_GET_SCENE_INFORMATION_NTF',(data)=>{
      debug('velux.on GW_GET_SCENE_INFORMATION_NTF:',data)
      scenes.scene[data.sceneID]=Object.assign({},data)
    })

    velux.api.on('GW_GET_NODE_INFORMATION_NTF',(data)=>{
      debug('velux.on GW_GET_NODE_INFORMATION_NTF:',data)
      scenes.scene[data.sceneID]=Object.assign({},data)
    })

    velux.api.on('GW_COMMAND_RUN_STATUS_NTF',(data)=>{
      debug('velux.on GW_COMMAND_RUN_STATUS_NTF:',data)
      velux.event.emit('sceneStatus',data)
    })
    
    velux.api.on('GW_SCENE_INFORMATION_CHANGED_NTF',(data)=>{
      debug('velux.on GW_SCENE_INFORMATION_CHANGED_NTF:',data)
      if (scenes.scene[data.sceneID]) {
        scenes.scene[data.sceneID]=Object.assign(scenes.scene[data.sceneID],data)
        velux.event.emit('sceneUpdate',data.sceneID)
      } else if (intern.started) {
        scenes.getSceneInformation(data.sceneID)
        .then(()=>{velux.event.emit('sceneUpdate',data.sceneID)})
        .catch((err)=>{velux.event.emit('error',err)})
      }
    })
    
    scenes.getVelocityTagByName = function(name){
      debug('getVelocityTagByName:',name)
      return velux.api.typs.VelocityTag[name]
    }

    
    
    
    /* init */
    scenes.getSceneList()
    .then(()=>{
      debug('getSceneList ready')
      intern.started = true,
      resolve(scenes)
    }).catch((err)=>{reject(err)})
  })
}
exports.getScenes = getScenes
