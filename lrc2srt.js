let DragBox = document.getElementById('DragBox');
let Textarea = document.getElementById('Textarea');
let Downloader = document.getElementById("Downloader");
let filelists = new Object();

DragBox.addEventListener("dragenter", function(e){
  e.stopPropagation();
  e.preventDefault();
}, false);

DragBox.addEventListener("dragover", function(e){
  e.stopPropagation();
  e.preventDefault();
}, false);

DragBox.addEventListener("drop", function(e){
  e.stopPropagation();
  e.preventDefault();
  
  let dt = e.dataTransfer;
  let files = dt.files;
  for (let i = 0; i < files.length; i++) {
  	let file = files.item(i);
    handle(file);
  }
}, false);

function handle(file){
  //console.log(file)
  let reader = new FileReader();
  reader.onload = function(e){
  	filelists[file.name.replace(/\.lrc$/i,'.srt')] = this.result;
    Textarea.innerText = this.result;
  };
  reader.onerror = function(e){
    alert("读取文件失败！");
    //console.log(e);
  }
  reader.readAsText(file);
};

function lrc2srt(lrc){
  function parseMs(min,sec,mil){
  	function add0(num){return num>10?num.toString():`0${num}`;};
  	return `${add0(Math.floor(min/60))}:${add0(min%60)}:${sec},${mil}`;
  }
  let lrcRe = /\[(\d\d):(\d\d).(\d{2,3})\]([^\[]+)/g;
  let line;
  let lrcs = new Object();
  let lasttime = -1;
  let tmptime;
  while ((line = lrcRe.exec(lrc)) !== null) {
  	line[3] = line[3].length == 2 ? `${line[3]}0` : line[3];
    tmptime = 60000*parseInt(line[1]) + 1000*parseInt(line[2]) + parseInt(line[3]);
    if(tmptime <= lasttime){
      if(tmptime in lrcs){
        lrcs[tmptime].push(line[4].trim());
      }
    }else{
      lasttime = tmptime;
      lrcs[tmptime] =[line[1], line[2], line[3], line[4].trim()];
    }
  }
  lrcs = Object.values(lrcs);
  lrcs.push(["60","00","000","",""]);
  //console.log(lrcs);
  lrcs.map(function(curr,index){
    if(index < lrcs.length-1){
      curr[5] = lrcs[index+1][0];
      curr[6] = lrcs[index+1][1];
      curr[7] = lrcs[index+1][2];
      if(curr[4])
        curr[4] += "\n";
      else
        curr[4] = "";
      }
    return curr;
  });
  lrcs.pop();
  let count = 1;
  let srt = lrcs.reduce(function(prev,curr){
    if(curr[3])
      return prev+`${count++}\n${parseMs(curr[0],curr[1],curr[2])} --> ${parseMs(curr[5],curr[6],curr[7])}\n${curr[3]}\n${curr[4]}\n`;
    else
      return prev;
  },"") + '\n';
  return srt;
}

function convert(){
  if(Object.keys(filelists).length == 1){
  	let srt = lrc2srt(Object.values(filelists)[0]);
  	let blob = new Blob([srt], {type:"text/plain"});
  	Downloader.download = Object.keys(filelists)[0];
    Downloader.href = URL.createObjectURL(blob);
    Downloader.style.display = 'inline';
    Textarea.innerText = srt;
  }else{
  	let zip = new JSZip();
    for(let filename in filelists){
      let srt = lrc2srt(filelists[filename]);
      zip.file(filename, srt);
    }
    zip.generateAsync({type:"blob"})
    .then(function(content) {
      Downloader.download = "srts.zip";
      Downloader.href = URL.createObjectURL(content);
      Downloader.style.display = 'inline';
      Textarea.innerText = "请点击链接下载ZIP文件";
    });
  }
}

function reset(){
  filelists = new Object();
}
