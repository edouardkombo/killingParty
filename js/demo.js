'use strict';

var Bullet = function (camera, scene) {
	// 1. Cr�ation du mesh et du material de la munition
	var mesh = BABYLON.Mesh.CreateSphere("bullet", 1, 1, scene);
	mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
	mesh.material = new BABYLON.StandardMaterial("bMat", scene);
	mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
	mesh.position = camera.position.clone();
        
	// 2. On determine la direction
	var direction = getForwardVector(camera.rotation);
	direction.normalize();
        
	// 3. Il est vivant ! (pour le moment)
	var alive = true;
	var lifeTimer = null;
	
	var internalDispose = function () {
		 if (alive) {
			if (lifeTimer) {
				clearTimeout(lifeTimer);
			}
			
			mesh.dispose();
			lifeTimer = null;
			alive = false;
		}  
	};
	
	// 4. Au bout de 1.5 secondes on supprime le projectil de la sc�ne.
	lifeTimer = setTimeout(function() {
		internalDispose();
	}, 500);
	
	// La vitesse est publique, on peut la modifier facilement
	this.speed = 1;

	// 5. Logique de mise � jour
	this.update = function () {
		if (!alive) {
			return false;
		}
                
		// On incr�mente la position avec la direction et la vitesse d�sir�e.
		mesh.position.x += direction.x * this.speed;
		mesh.position.y += direction.y * this.speed;
		mesh.position.z += direction.z * this.speed;
			
		// On test les collision manuellement. Si on tombe sur un objet ayant un tag
		// Alors on le supprime
		var meshToRemove = null;
		var i = 0;
		var size = scene.meshes.length;
		var hit = false;
		
		while (i < size && !hit) {
			if (scene.meshes[i].tag && mesh.intersectsMesh(scene.meshes[i], false)) { 
				meshToRemove = scene.meshes[i];
			}
			i++;
		}
		
		if (meshToRemove) {
			meshToRemove.dispose();
			return true;
		}
		
		return false;
	};
	
	this.dispose = function () {
		internalDispose();
	};
};

function runDemo(canvasId) {
	var canvas = document.getElementById(canvasId);
	var engine = new BABYLON.Engine(canvas, true);
	
	// Cr�ation de la sc�ne
	var scene = new BABYLON.Scene(engine);
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
	scene.collisionsEnabled = true;
    
	// Ajout d'une cam�ra et de son contr�leur
    var camera = new BABYLON.FreeCamera("MainCamera", new BABYLON.Vector3(0, 2.5, 5), scene);
    camera.applyGravity = true;
    camera.checkCollisions = true;
	
	camera.speed = 0.5;
	camera.angularSensibility = 1000;
	
	camera.keysUp = [90]; // Touche Z
	camera.keysDown = [83]; // Touche S
	camera.keysLeft = [81]; // Touche Q
	camera.keysRight = [68]; // Touche D;
	scene.activeCamera.attachControl(canvas);
	
	// Ajout d'une lumi�re
	var light = new BABYLON.PointLight("DirLight", new BABYLON.Vector3(0, 10, 0), scene);
	light.diffuse = new BABYLON.Color3(1, 1, 1);
	light.specular = new BABYLON.Color3(0.6, 0.6, 0.6);
	light.intensity = 2.5;
	
	
	document.addEventListener("contextmenu", function (e) { e.preventDefault();	});
	
	// On ajoute une skybox
	createSkybox(scene);
	
	// Enfin la sc�ne de d�mo
	createDemoScene(scene);
	
	var weapon = BABYLON.Mesh.CreatePlane("weapon", 1, scene);
	weapon.scaling = new BABYLON.Vector3(0.5, 0.5, 1);
	weapon.material = new BABYLON.StandardMaterial("wMaterial", scene);
	weapon.material.diffuseTexture = new BABYLON.Texture("images/weapon.png", scene);
        weapon.material.diffuseTexture.hasAlpha = true;
	weapon.position.x = 0.4;
	weapon.position.y = -0.3; //-0.1;
	weapon.position.z = 1; //0.4;
	weapon.parent = camera;
	
	var bullets = [];
	canvas.addEventListener("mouseup", function (e) {
                //Play sound
                $('#sound').append('<embed id="embed_player" src="sounds/beretta.mp3" autostart="true" hidden="true"></embed>');
		var bullet = new Bullet(camera, scene);
		bullets.push(bullet);
	});
	
	// Lancement de la boucle principale
	engine.runRenderLoop(function() {
		var toRemove = [];
		for (var i = 0, l = bullets.length; i < l; i++) {
			if (bullets[i].update()) {
				toRemove.push(i);
				bullets[i].dispose();
			}
		}
		
		for (var i = 0, l = toRemove.length; i < l; i++) {
			bullets.splice(toRemove[i], 1);
		}
		
		scene.render();
	});
}

function getForwardVector(rotation) {
	var rotationMatrix = BABYLON.Matrix.RotationYawPitchRoll(rotation.y, rotation.x, rotation.z);
	var forward = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 1), rotationMatrix);
	return forward;
}

function createSkybox(scene) {
	// Cr�ation d'une material
	var sMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
	sMaterial.backFaceCulling = false;
	sMaterial.reflectionTexture = new BABYLON.CubeTexture("images/skybox/skybox", scene);
	sMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	
	// Cr�ation d'un cube avec la material adapt�e
	var skybox = BABYLON.Mesh.CreateBox("skybox", 250, scene);
	skybox.material = sMaterial;
}

function createDemoScene(scene) {
	// Cr�ation d'un sol
	var ground = BABYLON.Mesh.CreatePlane("ground", 150, scene);
	ground.rotation.x = Math.PI / 2;
	ground.material = new BABYLON.StandardMaterial("gMaterial", scene);
	ground.material.diffuseTexture = new BABYLON.Texture("images/ground.jpg", scene);
	ground.checkCollisions = true;
	
	// Et quelques cubes...
	var boxMaterial = new BABYLON.StandardMaterial("bMaterial", scene);
	boxMaterial.diffuseTexture = new BABYLON.Texture("images/box.png", scene);
	
	var positions = [
		{ x: -15, z: 15 },
		{ x: -15, z: -15 },
		{ x: 15, z: 15 },
		{ x: 15, z: -15 }
	];
	
	var cubeSize = 2.5;
	
	for (var i = 0; i < 25; i++) {
		var box = BABYLON.Mesh.CreateBox("box1", cubeSize, scene);
		box.tag = "enemy";
		box.position = new BABYLON.Vector3(random(0, 20), cubeSize / 2, random(0, 20));
		box.material = boxMaterial;
		box.checkCollisions = true;
	}
}

function random(min, max) {
	return (Math.random() * (max - min) + min);
}