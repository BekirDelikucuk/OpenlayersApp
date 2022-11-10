let map, draw, source, layer;
let point = []
let points=[]
let selectedItem=null;

const initializeMap = async () => {
  
    source = new ol.source.Vector({ wrapX: false });

    layer = new ol.layer.Vector({
        source: source,
        
    });

    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
             layer
        ],
        view: new ol.View({
            center: [3875337.272593909, 4673762.797695817],
            zoom: 7,
            maxZoom: 13,
        })
    });

    addInteraction();

    setTimeout(()=>{

      getAllQuery(true) ;

    },300);
}

const addInteraction = () => {

    draw = new ol.interaction.Draw({
        source: source,
        type: "Point"
    });

    draw.setActive(false);
    map.addInteraction(draw);
    draw.on("drawend",
        (event) => {
           console.log(event.feature.getGeometry().getCoordinates()); 
           point=event.feature.getGeometry().getCoordinates();  
            draw.setActive(false);
            panel();
        });

}

const addDrawing = () => {

    draw.setActive(true);
}

const panel = () => {
   jsPanel.create({
        id:'myPanel',
        theme: 'primary',
        headerTitle: 'Point Table',
        contentSize: "500 250",
        position: 'center 50 50',
        content: '<form action="#" onsubmit="event.preventDefault();return addPoint();">' +
            '<label for="name">Name:</label><br>' +
            '<input type="text" id="name" name="name"><br>' +
            "<label for='xCoordinate'> X Coordinate:</label>" +
            "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br><br>" +
            "<label for='yCoordinate'> Y Coordinate:</label>" +
            "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br><br>" +
            '<input id="addSubmit" type="submit" value="Submit"></form>',
        callback: function () {
            document.getElementById("xCoordinate").value = point[0];
            document.getElementById("yCoordinate").value = point[1];
        },       
         
        // onbeforeclose: function () {
        //     return confirm('Do you really want to close the panel?');
        // }
    });
 
}


 const locationPanel =()=>{
    jsPanel.create({
        id:"locpanel",
        theme: 'primary',
        headerTitle: 'Data Table',
        position: 'center 50 50',
        callback: function () {
            this.content.innerHTML = '<table id="location" class="display" width="100%"></table>';
            
        },
        // onbeforeclose: function () {
        //     return confirm('Do you really want to close the panel?');
        // }
    });
   

 }
 
 const getAllQuery=(isLoad=false)=>{
   
    gettAllPoint().then(data=>{
        if(isLoad){
            points=data;
            for(var i=0;i<data.length;i++){

                var elem=data[i];
    
                var geometry=new ol.geom.Point([elem.coordinateX,elem.coordinateY]).transform('EPSG:3857', 'EPSG:3857');
    
                var featurething = new ol.Feature({
                    name: elem.locationName,
                    geometry: geometry
                });

                featurething.set("id",elem.id);
                source.addFeature(featurething);               
    
            }
            return;

        }
        $('#location').DataTable({
            data:data,
            columns: [
                { title: 'id',data:'id' },
                { title: 'LocationName',data:'locationName' },
                { title: 'X',data:'coordinateX' },
                { title: 'Y',data:'coordinateY' },
                {
                    render: function (data, type, row) {
                      return (
                        "<button value='" +
                        row.id +
                        "' onclick='deletePoint(this.value)' class='btnDelete'>Delete</button>"
                      );
                    },
                  },
                  {
                    render: function (data, type, row) {
                      return (
                        "<button value='" +
                        row.id +
                        "' onclick='updatePanel(this.value)' class='btnUpdate'>Edit</button>"
                      );
                    },
                  },
                // {title:'Delete',defaultContent:'<button onclick="deletePoint()">Delete!</button>'}
            ],
        
        });

    });


}

function addPoint(){
 
    let LocationName=document.getElementById("name").value;

    if((!LocationName || /^\s*$/.test(LocationName))){
      
        toastr.error("Location name cant be blank");
        return ;
        }
        else{

            toastr.success("location add the query drawing");
        }
    let data={
  "locationName":LocationName,
  "coordinateX": point[0],
  "coordinateY": point[1]
         
    };
    fetch("https://localhost:7014/api/Door",{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data),
    })
    .then((response)=>(response.json()))
    .then(data => {
        console.log("Affected Rows:", data);
    })
    .catch(error => {
        console.error(error);
    })
    .finally(() => {
        point = [];
        document.querySelector('#myPanel').close();
    });
    
    return true;

}

async function gettAllPoint(){

    return new Promise((resolve,reject)=>{

        fetch("https://localhost:7014/api/Door")
        .then(response => response.json())
        .then(data => resolve(data))
        .catch((e)=>{

            reject(e);
        });

    });  
}

function deletePoint(id){
  
    // $(".btnDelete").click(function(){

    //        let id=$(this).data("id");

         return new Promise((resolve,reject)=>{

            toastr.success("Point has been deleted");
            fetch("https://localhost:7014/api/Door/?DoorID="+id,{
                method:"DELETE",
                headers:{
                    "Content-Type": "application/json",
                },
                body:JSON.stringify(id),
            })
            .then((response)=>(response.json))
            .then(data => resolve(data)).catch((e)=>{

                reject(e);
            });
          
         })

        // });
}

const updatePanel=(id)=>{
  
    var feature = layer.getSource().getFeatures().find(x=>x.get("id")==id);
    var extent = feature.getGeometry().getExtent().slice(0);

    if(feature){
        map.getView().fit(extent, map.getSize());
        
    }
  
   

 selectedItem = points.find((x) => x.id == id);
  console.log(selectedItem);

     jsPanel.create({
        id:'updatePanel',
        theme: 'primary',
        headerTitle: 'Update Table',
        contentSize: "500 250",
        position: 'center 50 50',
        content: '<form action="#" onsubmit="event.preventDefault();">' +
            '<label for="name">Name:</label><br>' +
            '<input type="text" id="upname" name="name"><br>' +
            "<label for='xCoordinate'> X Coordinate:</label>" +
            "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br><br>" +
            "<label for='yCoordinate'> Y Coordinate:</label>" +
            "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br><br>" +
            '<input id="upSubmit" type="submit" value="Submit">'+
            // '<input id="modify" type="submit" value="Modify"></form>',
            // '<button onclick="" type="button" >Submit</button>'+
             '<button onclick=" modifyClick2();" type="button" >Modify</button>',


            
        callback: function () {
            document.getElementById("xCoordinate").value =selectedItem.coordinateX;
            document.getElementById("yCoordinate").value = selectedItem.coordinateY;
            document.getElementById("upname").value=selectedItem.locationName;
        },       
         
        // onbeforeclose: function () {
        //     return confirm('Do you really want to close the panel?');
        // }
    })
 document.getElementById("upSubmit").addEventListener("click",function(){
    let data={
        id:selectedItem.id,
        locationName:document.getElementById("upname").value,
        coordinateX:document.getElementById("xCoordinate").value,
        coordinateY:document.getElementById("yCoordinate").value
    };
   

    selectedItem.locationName=data.locationName;

    PutMethod(selectedItem,'#updatePanel');

    // return new Promise((resolve,reject)=>{

    //     let locationName=document.getElementById("upname").value

    //     if((!locationName || /^\s*$/.test(locationName))){
      
    //         toastr.error("Location name cant be blank");
    //         return ;
    //         }
    //         else{
    
    //             toastr.success("location add the query drawing");
    //         }

    //     fetch("https://localhost:7014/api/Door/?DoorID",{
    //         method:"PUT",
    //         headers:{
    //             "Content-Type": "application/json",
    //         },
    //         body:JSON.stringify(selectedItem),
    //     })
    //     .then((response)=>(response.json))
    //     .then(data => resolve(data)).catch((e)=>{

    //         reject(e);
    //     })
    //     .finally(()=>{
    //         document.querySelector('#updatePanel').close();           
         
    //     });

      

    //  })



})

   
}

let modifyClick = (e) => {  
    //Remove previous interactions
    //removeInteractions();
   
    //Select Features
    document.querySelector('#updatePanel').close();
    
    let select = new ol.interaction.Select({
      layers: [layer],
      style: (e) => {
        return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 10,
              fill: new ol.style.Fill({
                color: [247, 5, 25, 1],
              }),
              stroke: new ol.style.Stroke({
                color: [5, 74, 247, 1],
                width: 5
              })
            })
          });
      }
    });

    // map.getView().fit(feature.getGeometry());
    // map.getView().setZoom(15);
   
    //Add Modify Control to map
    let modify = new ol.interaction.Modify({
      features: select.getFeatures()  
    });
   
    map.addInteraction(select);
    map.addInteraction(modify);
    modify.on("modifyend", (m) => {
        console.log(
          m.features.getArray()[0].getGeometry().getCoordinates()
        );
        // point=m.feature.getGeometry().getCoordinates();
        var id=m.features.getArray()[0].get("id");
var coords= m.features.getArray()[0].getGeometry().getCoordinates();
        modify.setActive(false);
       updatePanel(id);
       $("#xCoordinate").val(coords[0]);
       $("#yCoordinate").val(coords[1]);
    });
  

  }


  
let modifyClick2 = (e) => {  

  //let  selectedItem = points.find((x) => x.id == id);
  document.querySelector('#locpanel').close();
    document.querySelector('#updatePanel').close();
   
    let select = new ol.interaction.Select({
      layers: [layer],
      style: (e) => {
        return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 10,
              fill: new ol.style.Fill({
                color: [247, 5, 25, 1],
              }),
              stroke: new ol.style.Stroke({
                color: [5, 74, 247, 1],
                width: 5
              })
            })
          });
      }
    });

    let modify = new ol.interaction.Modify({
      features: select.getFeatures()  
    });
   
    map.addInteraction(select);
    map.addInteraction(modify);
    modify.on("modifyend", (m) => {
        // console.log(
        //   m.features.getArray()[0].getGeometry().getCoordinates()
        // );

var coords= m.features.getArray()[0].getGeometry().getCoordinates();
selectedItem.coordinateX=coords[0];
selectedItem.coordinateY=coords[1];
console.log(selectedItem);
        modify.setActive(false);
        jsPanel.create({
            id:'modifyPanel',
            theme: 'primary',
            headerTitle: 'Modify Table',
            contentSize: "500 250",
            position: 'center 50 50',
            content: '<form action="#" onsubmit="event.preventDefault();">' +
                '<label for="name">Name:</label><br>' +
                '<input type="text" id="modname" name="name"><br>' +
                "<label for='xCoordinate'> X Coordinate:</label>" +
                "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br><br>" +
                "<label for='yCoordinate'> Y Coordinate:</label>" +
                "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br><br>" +
                '<input id="modSubmit" type="submit" value="Submit">',            
            callback: function () {
                document.getElementById("modname").value=selectedItem.locationName;
                document.getElementById("xCoordinate").value =coords[0];
                document.getElementById("yCoordinate").value =coords[1];
            },       
        })
        let data=null;                                  
        document.getElementById("modSubmit").addEventListener("click",function(){
             data={
                id:selectedItem.id,
                locationName:document.getElementById("modname").value,
                coordinateX:coords[0],
                coordinateY:coords[1]
            };
            console.log(data);
            PutMethod(data,'#modifyPanel');
            
        })
       
    //      return new Promise((resolve,reject)=>{
    //      fetch("https://localhost:7014/api/Door/?DoorID",{
    //          method:"PUT",
    //          headers:{
    //              "Content-Type": "application/json",
    //          },
    //          body:JSON.stringify(data),
    //      })
    //      .then((response)=>(response.json))
    //      .then(data => resolve(data)).catch((e)=>{
     
    //          reject(e);
    //      })
    //      .finally(()=>{
    //          document.querySelector('#modifyPanel').close();           
            
    //      });

    //  });
   
    });
  

  }


function PutMethod(data,panelId){

    return new Promise((resolve,reject)=>{

        let locationName=data.locationName;

        if((!locationName || /^\s*$/.test(locationName))){
      
            toastr.error("Location name cant be blank");
            return ;
            }
            else{
    
                toastr.success("location add the query drawing");
            }

        fetch("https://localhost:7014/api/Door/?DoorID",{
            method:"PUT",
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify(data),
        })
        .then((response)=>(response.json))
        .then(data => resolve(data)).catch((e)=>{

            reject(e);
        })
        .finally(()=>{
            document.querySelector(panelId).close();
                    
         
        });

      

     })

}























