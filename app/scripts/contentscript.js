'use strict';

import axios from 'axios'

// metadata: { thread_id: '12345', user_id: '1234555' }
// video_idを取って、{thread_id, user_id}を渡すPromiseを返す
function get_video_metadata(video_id) {
    return new Promise(function(resolve) {
        axios.get('http://flapi.nicovideo.jp/api/getflv/' + video_id).then((response) => {
            const data_arr = response.data.split('&').map((row)=>{ return row.split('=') })
            const thread_id = data_arr.find((row)=>{ return row[0] === 'thread_id'})[1]
            const user_id = data_arr.find((row)=>{ return row[0] === 'user_id'})[1]

            resolve({thread_id, user_id})
        })
    })
}

// video_metadata: { thread_id, user_id }
// vposes: [10000, 30000, 40000, ...]
// video_metadataを取って、vposesを渡すPromiseを返す
function get_vposes(video_metadata) {
    return new Promise(function(resolve) {
        const xml = `<thread thread="${video_metadata.thread_id}" version="20090904" res_from='-1000' user_id='${video_metadata.user_id}' />`
        axios.post('http://nmsg.nicovideo.jp/api', xml, { headers: { 'Content-Type': 'application/xml' }}).then((response) => {
            var parser = new DOMParser()
            const chats = parser.parseFromString(response.data, 'text/xml').getElementsByTagName('chat')
            const vposes = Array.from(chats)
                                .map((chat)=>{ return parseInt(chat.attributes.vpos.nodeValue) })
                                .sort((a, b) => { return a - b })
            resolve(vposes)
        })
    })
}

// video_id: 'sm9999'
// video_length: 123455
// video_idを取って、vposes単位の動画の長さを渡すPromiseを返す
function get_video_length(video_id) {
    return new Promise(function(resolve) {
        axios.get(`http:\/\/ext.nicovideo.jp/api/getthumbinfo/${video_id}`)
             .then((response) => {
                 var parser = new DOMParser()
                 var length_str = parser.parseFromString(response.data, 'text/xml')
                                        .getElementsByTagName('length')[0].textContent
                 var minutes = length_str.split(':')[0]
                 var seconds = length_str.split(':')[1]
                 var video_length = (parseInt(minutes) * 60 + parseInt(seconds)) * 100
                 resolve(video_length)
             })
    })
}

function get_ad_length(video_id){
    return new Promise(function(resolve){
        axios.get(`http:\/\/api.uad.nicovideo.jp/UadsVideoService/getAdvertisingJsonp?videoid=${video_id}`)
             .then((response) => {
                const data = JSON.parse(response.data.match(/callback\((.+)\);/)[1])
                if (data[0].adflg === 1) {
                    resolve(10 * 100)
                } else {
                    resolve(0)
                }
             })
    })
}

function get_scores(vposes, seekbar_length) {
    return new Promise((resolve) => {
        const resolution = 300.0
        var scores = []
        for(var i = 0; i < resolution; i++){
            const score = vposes.filter((vpose) => {
                return ( i * (seekbar_length / resolution) < vpose && vpose <= (i+1)*(seekbar_length / resolution) )
            }).length
            scores.push(score)
        }
        scores = stand(scores)
        resolve(scores)
    })
}

function get_graph_canvas(scores, seekbar_width_ratio) {
    return new Promise((resolve) => {
        const resolution = scores.length
        const cv_width = document.getElementsByClassName('XSlider')[0].clientWidth
        const cv_height = 50

        var cv = document.createElement('canvas')
        cv.id = 'comment-frequency-visualiser'
        cv.height = cv_height
        cv.width = cv_width * seekbar_width_ratio
        var ctx = cv.getContext('2d')

        for(var i = 0; i < resolution; i++) {
            ctx.beginPath();
            ctx.fillStyle = 'rgb(255,255,255)'
            ctx.fillRect(i * (cv_width / resolution),
                         0,
                         cv_width / resolution,
                         scores[i] * cv_height)
        }

        resolve(cv)
    })
}

// Arrayを引数にとり、要素を0から1の範囲に正規化したArrayを返す
function stand(arr) {
    const max = Math.max.apply(null, arr)
    return arr.map((elem) => { return elem / max })
}

function main() {
    const video_id = 'sm' + window.location.href.match(/^http:\/\/www.nicovideo.jp\/watch\/sm(\d+)$/)[1]
    Promise.all([
            get_video_metadata(video_id).then(get_vposes),
            get_video_length(video_id),
            get_ad_length(video_id)
    ]).then((values)=>{
        const vposes = values[0]
        const video_length = values[1]
        const seekbar_width_ratio = values[1] / (values[1] + values[2])

        get_scores(vposes, video_length).then((scores) => {
            return get_graph_canvas(scores, seekbar_width_ratio)
        }).then((cv) => {
            const seekbar = document.getElementsByClassName('SeekBar')[0]
                                    .nextElementSibling
            const seekbarParent = seekbar.parentNode
            seekbarParent.insertBefore(cv, seekbar)
        })
    })
}

function reloadCommentGraph() {
    var graphCanvas = document.getElementById('comment-frequency-visualiser')
    if (graphCanvas !== null) {
        graphCanvas.remove()
    }
    main()
}

// 押すとグラフがリロードされるボタン
function reloadButton() {
    var image = document.createElement('img')
    image.src = 'data:image/png;base64,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'
    image.height = 32
    var button = document.createElement('button')
    button.addEventListener('click', reloadCommentGraph)
    button.appendChild(image)
    button.style.padding = 0

    return button
}

// リロードボタンを、動画のコントローラ（動画下のバー）の右端に入れる
var controllerButtonsArea = document.getElementsByClassName('ControllerContainer-area')[2]
controllerButtonsArea.appendChild(reloadButton())

chrome.extension.onMessage.addListener(function(request) {
    if (request.type === 'reloadCommentGraph') {
        reloadCommentGraph()
    }
})
