window.addEventListener('DOMContentLoaded', function () {
  var cfg = window.PAPER_CONTENT || {};

  function setHtml(id, value) { var el=document.getElementById(id); if(el && value!==undefined) el.innerHTML=value; }
  function setHref(id, value) { var el=document.getElementById(id); if(el && value) el.href=value; }

  setHtml('paper-title',cfg.titleHtml); setHtml('paper-authors',cfg.authorsHtml); setHtml('paper-affiliation',cfg.affiliationHtml);
  setHtml('paper-affiliation-note',cfg.affiliationNoteHtml); setHtml('paper-venue',cfg.venueHtml); setHtml('paper-award',cfg.awardHtml);
  setHtml('teaser-caption',cfg.teaserCaption); setHtml('abstract-copy',cfg.abstractHtml); setHtml('interactive-intro',cfg.interactiveIntroHtml);
  setHtml('interactive-note',cfg.interactiveNoteHtml); setHtml('dataset-title',cfg.datasetTitleHtml); setHtml('dataset-intro-1',cfg.datasetIntro1Html);
  setHtml('dataset-intro-2',cfg.datasetIntro2Html); setHtml('experiments-intro',cfg.experimentsIntroHtml);
  var links=cfg.links||{}; ['pdf','arxiv','explainer','talk','tldr','code','data1','data2','checkpoints'].forEach(function(k){setHref('link-'+k,links[k]);});

  var localWalk=document.getElementById('walkthrough-local'), ytWalk=document.getElementById('walkthrough-youtube');
  if(cfg.walkthroughMode==='youtube' && ytWalk){ if(localWalk)localWalk.classList.add('is-hidden'); ytWalk.classList.remove('is-hidden'); ytWalk.src=cfg.walkthroughYoutubeEmbed||''; }

  var VISER_PLACEHOLDER_TEXT='Choose a scene above';
  var VISER_READY_TEXT='Click and move me';

  function getViewerBanner(viewer){return viewer&&viewer.parentElement?viewer.parentElement.querySelector('.viser-banner'):null}
  function getViewerHint(viewer){if(!viewer)return null;var container=viewer.closest('.interactive-card--viewer,.dataset-block--viewer');return container?container.querySelector('[data-viser-hint]'):null}
  function setViewerHintVisible(viewer,visible){var hint=getViewerHint(viewer);if(hint)hint.classList.toggle('is-hidden',!visible)}
  function setViewerPlaybackDock(viewer,enabled){if(viewer&&viewer.parentElement)viewer.parentElement.classList.toggle('pw-viser-with-playback',!!enabled)}
  function setViewerBanner(banner,isPlaceholder){
    if(!banner)return;
    if(isPlaceholder){banner.textContent=VISER_PLACEHOLDER_TEXT;banner.classList.add('is-placeholder');banner.classList.remove('is-hidden')}
    else{banner.textContent=VISER_READY_TEXT;banner.classList.remove('is-placeholder');banner.classList.add('is-hidden')}
  }

  document.querySelectorAll('video').forEach(function(video){
    video.addEventListener('loadedmetadata',function(){
      if(video.classList.contains('experiment-video'))video.playbackRate=2.0;
      var p=video.play();if(p&&p.catch)p.catch(function(){});
    });
  });
  document.querySelectorAll('video.experiment-video').forEach(function(video){
    if(video.parentElement&&video.parentElement.classList.contains('experiment-video-wrapper'))return;
    var parent=video.parentNode;if(!parent)return;
    var wrapper=document.createElement('div');wrapper.className='experiment-video-wrapper';parent.insertBefore(wrapper,video);wrapper.appendChild(video);
    var badge=document.createElement('div');badge.className='video-speed-badge';badge.textContent='2x';wrapper.appendChild(badge);
  });

  var DEFAULT_CAMERA={position:'1.00,0.00,1.00',lookAt:'0.00,0.00,0.00',up:'0.000,0.000,1.000'};
  function cameraFromButton(button,target){
    if(!button)return DEFAULT_CAMERA;var suffix=target?'-'+target:'';
    return {
      position:button.getAttribute('data-camera-position'+suffix)||button.getAttribute('data-camera-position')||DEFAULT_CAMERA.position,
      lookAt:button.getAttribute('data-camera-lookat'+suffix)||button.getAttribute('data-camera-lookat')||DEFAULT_CAMERA.lookAt,
      up:button.getAttribute('data-camera-up'+suffix)||button.getAttribute('data-camera-up')||DEFAULT_CAMERA.up
    };
  }
  function buildViewerSrc(base,filename,camera,dockPlayback){
    var rawPath='../../'+base+'/'+filename;
    var encoded=encodeURI(rawPath).replace(/\+/g,'%2B');
    return 'static/viser-client/index.html?playbackPath='+encoded+
      '&initialCameraPosition='+encodeURIComponent(camera.position)+
      '&initialCameraLookAt='+encodeURIComponent(camera.lookAt)+
      '&initialCameraUp='+encodeURIComponent(camera.up)+(dockPlayback?'&pwDockPlayback=1':'');
  }
  async function recordingExists(base,filename){
    try{var r=await fetch(base+'/'+filename,{method:'HEAD',cache:'no-store'});return r.ok}catch(e){return false}
  }
  async function loadViewer(viewer,banner,base,filename,camera,dockPlayback){
    if(!viewer)return;
    var ok=await recordingExists(base,filename);
    if(!ok){viewer.removeAttribute('src');viewer.dataset.base='';setViewerBanner(banner,true);setViewerHintVisible(viewer,false);setViewerPlaybackDock(viewer,false);return}
    viewer.src=buildViewerSrc(base,filename,camera,dockPlayback);viewer.dataset.base=base;setViewerBanner(banner,false);setViewerHintVisible(viewer,true);setViewerPlaybackDock(viewer,dockPlayback);
  }

  function createMagnifier(imageMap,roles){
    var zoom=2.5,lensSize=180,lenses={};
    function lens(role){if(!lenses[role]){var el=document.createElement('div');el.className='dataset-magnifier-lens is-hidden';document.body.appendChild(el);lenses[role]=el}return lenses[role]}
    function hideAll(){Object.keys(lenses).forEach(function(k){lenses[k].classList.add('is-hidden')})}
    roles.forEach(function(role){
      var img=imageMap[role];if(!img)return;
      function move(e){
        var r=img.getBoundingClientRect(),x=Math.max(0,Math.min(r.width,e.clientX-r.left)),y=Math.max(0,Math.min(r.height,e.clientY-r.top)),l=lens(role);
        l.style.backgroundImage='url("'+(img.currentSrc||img.src)+'")';l.style.backgroundSize=(r.width*zoom)+'px '+(r.height*zoom)+'px';
        l.style.backgroundPosition=-(x*zoom-lensSize/2)+'px '+-(y*zoom-lensSize/2)+'px';
        var left=e.clientX+12,top=e.clientY-lensSize/2;if(left+lensSize>innerWidth-8)left=e.clientX-lensSize-12;top=Math.max(8,Math.min(innerHeight-lensSize-8,top));
        l.style.left=Math.round(left)+'px';l.style.top=Math.round(top)+'px';l.classList.remove('is-hidden');
      }
      img.addEventListener('mouseenter',move);img.addEventListener('mousemove',move);img.addEventListener('mouseleave',function(){lens(role).classList.add('is-hidden')});
      window.addEventListener('scroll',function(){lens(role).classList.add('is-hidden')},{passive:true});window.addEventListener('resize',function(){lens(role).classList.add('is-hidden')});
    });
    return {hideAll:hideAll};
  }

  // Shared PointWorld-style prediction/GT viewers.
  var predFrame=document.getElementById('interactive-pred'),gtFrame=document.getElementById('interactive-gt');
  var predBanner=getViewerBanner(predFrame),gtBanner=getViewerBanner(gtFrame);
  if(predFrame){predFrame.removeAttribute('src');predFrame.dataset.base=''} if(gtFrame){gtFrame.removeAttribute('src');gtFrame.dataset.base=''}
  setViewerBanner(predBanner,true);setViewerBanner(gtBanner,true);setViewerHintVisible(predFrame,false);setViewerHintVisible(gtFrame,false);

  function initOneCarousel(opts){
    var container=opts.container;if(!container)return null;
    var row=container.querySelector(opts.thumbRowSelector),thumbs=Array.from(container.querySelectorAll(opts.thumbRowSelector+' .interactive-thumb'));
    var dotsBox=container.querySelector(opts.dotsSelector),inputs=document.getElementById(opts.inputsCardId),imageMap={};
    opts.imageRoles.forEach(function(role){imageMap[role]=inputs?inputs.querySelector('[data-role="'+role+'"]'):null});
    var mag=createMagnifier(imageMap,opts.imageRoles),active=-1,dots=[];
    if(dotsBox){dotsBox.innerHTML='';dots=thumbs.map(function(_,idx){var d=document.createElement('button');d.type='button';d.className='carousel-dot';d.setAttribute('aria-label','Show interactive scene '+(idx+1));d.addEventListener('click',function(){activate(idx)});dotsBox.appendChild(d);return d})}
    function updateImages(base,label){
      function set(role,path,alt){if(imageMap[role]){imageMap[role].src=base+'/'+path;imageMap[role].alt=(label||'')+' '+alt}}
      set('rgb0','cameras-rgb/cam0.png','RGB cam0');set('depth0','cameras-depth/cam0.png','depth cam0');set('rgb1','cameras-rgb/cam1.png','RGB cam1');set('depth1','cameras-depth/cam1.png','depth cam1');
      if(imageMap.rgb2)set('rgb2','cameras-rgb/cam2.png','RGB cam2');if(imageMap.depth2)set('depth2','cameras-depth/cam2.png','depth cam2');
    }
    async function activate(idx){
      if(idx<0||idx>=thumbs.length)return;active=idx;thumbs.forEach(function(b,i){b.classList.toggle('is-active',i===idx);b.setAttribute('aria-pressed',i===idx?'true':'false')});dots.forEach(function(d,i){d.classList.toggle('is-active',i===idx)});
      var button=thumbs[idx],base=button.getAttribute('data-base'),label=button.getAttribute('data-label')||'';if(!base)return;
      mag.hideAll();updateImages(base,label);
      await Promise.all([
        loadViewer(predFrame,predBanner,base,'scene-pred.viser',cameraFromButton(button,'pred'),true),
        loadViewer(gtFrame,gtBanner,base,'scene-gt.viser',cameraFromButton(button,'gt'),true)
      ]);
    }
    thumbs.forEach(function(b,i){b.addEventListener('click',function(){activate(i)})});
    container.querySelectorAll('.interactive-arrow').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var dir=a.dataset.direction==='prev'?-1:1,next=active<0?(dir<0?thumbs.length-1:0):(active+dir+thumbs.length)%thumbs.length;activate(next);if(thumbs[next])thumbs[next].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})})});
    return {activate:activate,getActiveIndex:function(){return active}};
  }

  var droidApi=initOneCarousel({container:document.getElementById('interactive-row-droid'),thumbRowSelector:'#interactive-thumb-row-droid',dotsSelector:'#interactive-dots-droid',inputsCardId:'interactive-inputs-droid',imageRoles:['rgb0','depth0','rgb1','depth1']});
  var b1kApi=initOneCarousel({container:document.getElementById('interactive-row-b1k'),thumbRowSelector:'#interactive-thumb-row-b1k',dotsSelector:'#interactive-dots-b1k',inputsCardId:'interactive-inputs-b1k',imageRoles:['rgb0','rgb1','rgb2','depth0','depth1','depth2']});
  function showInputs(which){
    var d=which==='droid', droidInputs=document.getElementById('interactive-inputs-droid'), b1kInputs=document.getElementById('interactive-inputs-b1k');
    if(droidInputs)droidInputs.classList.toggle('is-hidden',!d);
    if(b1kInputs)b1kInputs.classList.toggle('is-hidden',d);
  }
  showInputs('droid');
  if(droidApi)droidApi.activate(0);
  document.getElementById('interactive-row-droid')?.addEventListener('click',function(e){if(e.target.closest('.interactive-thumb'))showInputs('droid')});
  document.getElementById('interactive-row-b1k')?.addEventListener('click',function(e){if(e.target.closest('.interactive-thumb'))showInputs('b1k')});

  // Dataset comparison section.
  (function initDataset(){
    var section=document.getElementById('dataset');if(!section)return;
    var thumbs=Array.from(section.querySelectorAll('.dataset-thumb')),row=section.querySelector('#dataset-thumb-row'),dotsBox=section.querySelector('#dataset-dots'),active=-1,dots=[];
    var ours=document.getElementById('dataset-viewer-ours'),orig=document.getElementById('dataset-viewer-original'),oursBanner=getViewerBanner(ours),origBanner=getViewerBanner(orig);
    if(ours){ours.removeAttribute('src');ours.dataset.base=''}if(orig){orig.removeAttribute('src');orig.dataset.base=''}setViewerBanner(oursBanner,true);setViewerBanner(origBanner,true);setViewerHintVisible(ours,false);setViewerHintVisible(orig,false);
    var imageMap={
      'ours-rgb-0':section.querySelector('[data-dataset-role="ours-rgb-0"]'),'ours-depth-0':section.querySelector('[data-dataset-role="ours-depth-0"]'),
      'ours-rgb-1':section.querySelector('[data-dataset-role="ours-rgb-1"]'),'ours-depth-1':section.querySelector('[data-dataset-role="ours-depth-1"]'),
      'original-rgb-0':section.querySelector('[data-dataset-role="original-rgb-0"]'),'original-depth-0':section.querySelector('[data-dataset-role="original-depth-0"]'),
      'original-rgb-1':section.querySelector('[data-dataset-role="original-rgb-1"]'),'original-depth-1':section.querySelector('[data-dataset-role="original-depth-1"]')
    };
    createMagnifier(imageMap,Object.keys(imageMap));
    if(dotsBox){dotsBox.innerHTML='';dots=thumbs.map(function(_,idx){var d=document.createElement('button');d.type='button';d.className='carousel-dot';d.setAttribute('aria-label','Show dataset sample '+(idx+1));d.addEventListener('click',function(){activate(idx)});dotsBox.appendChild(d);return d})}
    function updateImages(base,label){
      var map=[
        ['ours-rgb-0','/fs-refined/rgb_robot/cam0.png'],['ours-depth-0','/fs-refined/depth/cam0.png'],['ours-rgb-1','/fs-refined/rgb_robot/cam1.png'],['ours-depth-1','/fs-refined/depth/cam1.png'],
        ['original-rgb-0','/raw-tri/rgb_robot/cam0.png'],['original-depth-0','/raw-tri/depth/cam0.png'],['original-rgb-1','/raw-tri/rgb_robot/cam1.png'],['original-depth-1','/raw-tri/depth/cam1.png']
      ];map.forEach(function(m){if(imageMap[m[0]]){imageMap[m[0]].src=base+m[1];imageMap[m[0]].alt=(label||'Dataset')+' '+m[0]}});
    }
    async function activate(idx){
      if(idx<0||idx>=thumbs.length)return;active=idx;thumbs.forEach(function(b,i){b.classList.toggle('is-active',i===idx);b.setAttribute('aria-pressed',i===idx?'true':'false')});dots.forEach(function(d,i){d.classList.toggle('is-active',i===idx)});
      var button=thumbs[idx],base=button.dataset.base,label=button.dataset.label||'',cam=cameraFromButton(button);updateImages(base,label);
      await Promise.all([loadViewer(ours,oursBanner,base,'scene-fs-refined.viser',cam,false),loadViewer(orig,origBanner,base,'scene-raw-tri.viser',cam,false)]);
    }
    thumbs.forEach(function(b,i){b.addEventListener('click',function(){activate(i)})});
    section.querySelectorAll('.dataset-arrow').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var dir=a.dataset.direction==='prev'?-1:1,next=active<0?(dir<0?thumbs.length-1:0):(active+dir+thumbs.length)%thumbs.length;activate(next);if(thumbs[next])thumbs[next].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})})});
  })();
});
