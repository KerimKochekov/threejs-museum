/**
    Author: Hitarth Singh & Kerim Kochekov
    Project: Museum Imaginarium
    Description: Class for Room
*/

"use strict"; //To use the strict mode of JS.

function set_position(object, position){
    object.position.x = position[0];
    object.position.y = position[1];
    object.position.z = position[2];
}

function set_rotation(object, rotation){
    object.rotation.x = rotation[0];
    object.rotation.y = rotation[1];
    object.rotation.z = rotation[2];
}

var DOOR_SIZE = 20;
class Wall {
    constructor(width, height, position = [0,0,0], rotation = [0,0,0], material = null, windows = null){
        this.object = new THREE.Object3D();
        const geometry =  new THREE.BoxGeometry( width, height, 1);
        const loader = new THREE.TextureLoader();
        if (!material){
            material = new THREE.MeshBasicMaterial( {map: loader.load('assets/wall-texture.jpeg'), side: THREE.DoubleSide} );
        }
        this.box = new THREE.Mesh(geometry, material);
        this.object.add(this.box);
        set_rotation(this.object, rotation);
        set_position(this.object, position);
    }
    get_bounding_box(){
        this.box.geometry.computeBoundingBox();
        return this.box.geometry.boundingBox;
    }
}

function recompute_all_bounding_boxes(room){
    room.bounding_boxes = [];
    for (var i=0; i<room.objects.length; i++)
        room.bounding_boxes.push(room.objects[i].get_bounding_box());
}

class Room {
    constructor(length, height, width){
        this.bounding_boxes = []; //stores th bounding boxes of hard objects
        this.objects = [];
        this.player = (0,0);
        this.length = length;
        this.height = height;
        this.width = width;
        this.object = new THREE.Object3D();
        const loader = new THREE.TextureLoader();
        var wall_material = new THREE.MeshBasicMaterial( {map: loader.load('assets/wall-texture.jpeg'), side: THREE.DoubleSide} );
        var floor_material = new THREE.MeshBasicMaterial( {map: loader.load('assets/floor-texture.jpeg'), side: THREE.DoubleSide} );
        var ceiling_material = new THREE.MeshBasicMaterial( {map: loader.load('assets/ceiling-texture.jpeg'), side: THREE.DoubleSide} );
        var grass_material = new THREE.MeshBasicMaterial( {map: loader.load('assets/grass-texture.jpeg', function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(20, 20)}), side: THREE.DoubleSide} 
        );
        this.walls = {
            "Grass": {
                "name" : "Grass",
                "width": 1000,
                "height": 1000,
                "position": [0,-ROOM_HEIGHT/2-0.1, ROOM_LENGTH/2],
                "rotation": [Math.PI/2,0,0],
                "material": grass_material,
                "Wall": null
            },
            "Front": {
                "name" : "Back",
                "width": width,
                "height": height,
                "position": [0,0,0],
                "rotation": [0,0,0],
                "material": wall_material,
                "Wall": null
            },
            "Back": {
                "name" : "Front",
                "width": width - DOOR_SIZE/2,
                "height": height,
                "position": [-DOOR_SIZE/4,0,length],
                "rotation": [0,0,0],
                "material": wall_material,
                "Wall": null
            }, 
            "Left": {
                "name" : "Left",
                "width": length,
                "height": height,
                "position": [-width/2,0,length/2],
                "rotation": [0,Math.PI/2,0],
                "material": wall_material,
                "Wall": null
            },
            "Middle": {
                "name" : "Middle",
                "width": length - DOOR_SIZE,
                "height": height,
                "position": [0,0,length/2],
                "rotation": [0,Math.PI/2,0],
                "material": wall_material,
                "Wall": null
            },
            "Right": {
                "name" : "Right",
                "width": length,
                "height": height,
                "position": [width/2,0,length/2],
                "rotation": [0,Math.PI/2,0],
                "material": wall_material,
                "Wall": null
            }, 
            "Ground": {
                "name" : "Ground",
                "width": width,
                "height": length,
                "position": [0,-height/2,length/2],
                "rotation": [Math.PI/2,0,0],
                "material": floor_material,
                "Wall": null
            }, 
            "Ceiling": {
                "name" : "Ceiling",
                "width": width,
                "height": length,
                "position": [0,height/2,length/2],
                "rotation": [Math.PI/2,0,0],
                "material": ceiling_material,
                "Wall": null
            }
        }; 
        for (var wall_name in this.walls){
            var wall = this.walls[wall_name];
            var wall_object = new Wall(wall.width, wall.height, wall.position, wall.rotation, wall.material);
            console.log(wall.position, wall.rotation, wall.material);
            wall.Wall = wall_object;
            this.objects.push(wall_object);
            this.object.add(wall_object.object);
        }
        this.decorations = {
            "Philopoemen": {
                "scale": 0.04,
                "path": './objects/philopoemen/scene.gltf',
                "position": [5, -8, 60],
                "rotation": [Math.PI/2, -Math.PI, Math.PI/2]
            },
            "Neptune": {
                "scale": 1,
                "path": './objects/neptune/scene.gltf',
                "position": [25, -10, 9],
                "rotation": [-Math.PI/2, 0, Math.PI/2]
            },
            "Bench": {
                "scale": 0.08,
                "path": './objects/bench/scene.gltf',
                "position": [-15, -10, 40],
                "rotation": [Math.PI/2,Math.PI,Math.PI/2]
            },
            "Bonsai": {
                "scale": 0.1,
                "path": './objects/bonsai/scene.gltf',
                "position": [-25,-10,0],
                "rotation": [Math.PI/2,Math.PI,0]
            },
            "Light": {
                "scale": 0.008,
                "path": './objects/light/scene.gltf',
                "position": [-15,3.6,43],
                "rotation": [Math.PI/2,Math.PI,0]
            }
        };
        for (var decoration_name in this.decorations){
            var decoration = this.decorations[decoration_name];
            var main_object = load_object(decoration);
            // decoration.tmp = main_object;
            this.object.add(main_object);
        }
        recompute_all_bounding_boxes(this);
    }
    
    inside_solid(vec){
        for (var i = 0; i < this.bounding_boxes.length; i++){
            var box = this.bounding_boxes[i];
            if (box.containsPoint(vec)){
                return true;
            }
        }
        return false;
    }
    
    ray_intersects(ray){
        for (var i = 0; i < this.bounding_boxes.length; i++){
            
            var box = this.bounding_boxes[i];
            if (ray.intersectsBox(box)){
                return true;
            }
        }
        return false;
    }
    
    triangle_intersects(triangle){
        for (var i = 0; i < this.bounding_boxes.length; i++){
            console.log("Checking box " + String(i));
            var box = this.bounding_boxes[i];
            if (box.intersectsTriangle(triangle)){
                return true;
            }
        }
        return false;
    }
}

