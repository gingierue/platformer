var socket=io();
socket.on('levelList',(listLevels)=>{
  var ul=document.getElementById('list');
  ul.innerHTML="";
  for(i in listLevels){
    li=document.createElement('li');
    a=document.createElement('a');
    a.href="/levels/"+listLevels[i];
    a.innerText=listLevels[i];
    li.appendChild(a);
    ul.appendChild(li);
  }
})
socket.emit("listLevels");