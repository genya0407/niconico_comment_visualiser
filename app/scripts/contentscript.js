'use strict';

import axios from 'axios'
import colormap from 'colormap'

window.addEventListener("load", function(){

    class Analyse {
        constructor(video_id) {
            this.video_id = video_id
        }

        vposes(callback) {
            axios.get('http://flapi.nicovideo.jp/api/getflv/' + this.video_id)
                 .then((response) => {
                     const data_arr = response.data.split('&').map((row)=>{ return row.split('=') })
                     const thread_id = data_arr.find((row)=>{ return row[0] === 'thread_id'})[1]
                     const user_id = data_arr.find((row)=>{ return row[0] === 'user_id'})[1]

                     const xml = `<thread thread="${thread_id}" version="20090904" res_from='-1000' user_id='${user_id}' />`
                     axios.post('http://nmsg.nicovideo.jp/api', xml, { headers: { 'Content-Type': 'application/xml' }})
                          .then((response) => {
                              var parser = new DOMParser()
                              const chats = parser.parseFromString(response.data, 'text/xml')
                                                  .getElementsByTagName('chat')
                              const vposes = Array.from(chats)
                                                  .map((chat)=>{ return parseInt(chat.attributes.vpos.nodeValue) })
                                                  .sort((a, b) => { return a - b })
                                                  .map((vpos) => { return vpos })
                              callback(vposes)
                          })
                 })
        }

        get_length(callback) {
            axios.get(`http:\/\/ext.nicovideo.jp/api/getthumbinfo/${this.video_id}`)
                 .then((response) => {
                     var parser = new DOMParser()
                     var length_str = parser.parseFromString(response.data, 'text/xml')
                                            .getElementsByTagName('length')[0].textContent
                     var minutes = length_str.split(':')[0]
                     var seconds = length_str.split(':')[1]
                     var video_length = (parseInt(minutes) * 60 + parseInt(seconds)) * 100
                     callback(video_length)
                 })
        }
    }

    function stand(arr) {
        const max = Math.max.apply(null, arr)
        return arr.map((elem) => { return elem / max })
    }

    var analyser = new Analyse(
            'sm' + window.location.href.match(/^http:\/\/www.nicovideo.jp\/watch\/sm(\d+)$/)[1]
            )
    analyser.vposes((vposes)=>{
        analyser.get_length((video_length) => {
            var elem = document.createElement('canvas')
            elem.id = 'comment-frequency-visualiser'
            const seekbar = document.getElementsByClassName('SeekBar')[0]
                                    .nextElementSibling
            const seekbarParent = seekbar.parentNode
            seekbarParent.insertBefore(elem, seekbar)

            var cv = document.getElementById('comment-frequency-visualiser')
            const cv_width = 624 //seekbar.offsetWidth
            cv.height = 100
            cv.width = cv_width
            var ctx = cv.getContext('2d')

            const resolution = 300.0
            var scores = []
            for(var i = 0; i < resolution; i++){
                const score = vposes.filter((vpose) => {
                    return ( i * (video_length / resolution) < vpose && vpose <= (i+1)*(video_length / resolution) )
                }).length
                scores.push(score)
            }
            scores = stand(scores)
            for(var i = 0; i < resolution; i++) {
                ctx.beginPath();
                ctx.fillStyle = 'rgb(255,255,255)'
                ctx.fillRect(i * (cv_width / resolution),
                             0,
                             cv_width / resolution,
                             scores[i] * 100)
            }
        })
    })
})
