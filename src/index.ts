// We define the empty imports so the auto-complete feature works as expected.
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Animator, AudioSource, AvatarAttach, ColliderLayer, GltfContainer, InputAction, Material, Transform, VideoPlayer, VisibilityComponent, engine, pointerEventsSystem } from '@dcl/sdk/ecs'

import CANNON from 'cannon';
import { loadColliders } from './func.wallCollidersSetup'
import { Ball } from './class.ball'
import { loadCollidersFromJSON } from './func.loadJsonColliders';

/*

	WhatDo:

	This is a simple scene showing how to import colliders from a JSON file generated by the 
	Blender plugin Decentraland Toolkit: Cannon Colliders
	https://github.com/stom66/blender-dcltk-cannon-colliders/

	Most of this page is the same as the Dcl example cannon scene.
	It sets up a generic cannon test world, along with some rigidbodiy spheres to interact with
	the colliders/scene. It also adds a visual mesh to represent the colliders that are created.

	The actual code for loading and creating the colliders is in the file: func.loadJsonColliders.ts

*/

export function main() {

	// ██╗   ██╗██╗███████╗██╗   ██╗ █████╗ ██╗         ███╗   ███╗███████╗███████╗██╗  ██╗
	// ██║   ██║██║██╔════╝██║   ██║██╔══██╗██║         ████╗ ████║██╔════╝██╔════╝██║  ██║
	// ██║   ██║██║███████╗██║   ██║███████║██║         ██╔████╔██║█████╗  ███████╗███████║
	// ╚██╗ ██╔╝██║╚════██║██║   ██║██╔══██║██║         ██║╚██╔╝██║██╔══╝  ╚════██║██╔══██║
	//  ╚████╔╝ ██║███████║╚██████╔╝██║  ██║███████╗    ██║ ╚═╝ ██║███████╗███████║██║  ██║
	//   ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
	//                                                                                     
	// Spawn in the visual mesh for the cannon colliders
	const entity = engine.addEntity()
	Transform.create(entity, {
		rotation: Quaternion.fromEulerDegrees(0, 180, 0)
	})
	GltfContainer.create(entity, {
		src: 'assets/glb/basic-colliders.glb', 
	})
	


	// ██████╗  █████╗ ██╗     ██╗     ███████╗
	// ██╔══██╗██╔══██╗██║     ██║     ██╔════╝
	// ██████╔╝███████║██║     ██║     ███████╗
	// ██╔══██╗██╔══██║██║     ██║     ╚════██║
	// ██████╔╝██║  ██║███████╗███████╗███████║
	// ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
	//                                         
	const balls      : Ball[]        = [] // Store the balls
	const ballBodies : CANNON.Body[] = [] // Store ball bodies
	let forwardVector: Vector3       = Vector3.rotate(Vector3.Forward(), Transform.get(engine.CameraEntity).rotation) // Camera's forward vector
	const vectorScale: number        = 25

	// Setup the spawn positions. We want 4 above the ramps, and 4 above the cubes.
	const positions: any = [
		Vector3.create(2, 8, 3),
		Vector3.create(6, 8, 3),
		Vector3.create(10, 8, 3),
		Vector3.create(14, 8, 3),

		Vector3.create(2, 8, 14),
		Vector3.create(6, 8, 14),
		Vector3.create(10, 8, 14),
		Vector3.create(14, 8, 14),
	]
	
	// Create the balls at the specified positions
	for (let i = 0; i < positions.length; i++) {

		// Add the ball
		const ball = new Ball('assets/glb/ball.glb', {
			position: positions[i],
			rotation: Quaternion.Zero(),
			scale   : Vector3.One()
		})
		balls.push(ball)

		// Allow the user to interact with the ball
		pointerEventsSystem.onPointerDown(
			{
				entity: ball.entity,
				opts  : {
					button   : InputAction.IA_POINTER,
					hoverText: 'kick'
				}
			},
			function (cmd: any) {
				// Apply impulse based on the direction of the camera
				ballBodies[i].applyImpulse(
					new CANNON.Vec3(forwardVector.x * vectorScale, forwardVector.y * vectorScale, forwardVector.z * vectorScale),
					new CANNON.Vec3(cmd.hit?.position?.x, cmd.hit?.position?.y, cmd.hit?.position?.z)
				)
			}
		)
	}

	function resetBallPositions() {
		ballBodies.forEach((ball, i) => {
			ball.position = positions[i]
		});
	}


	
	//  ██████╗ █████╗ ███╗   ██╗███╗   ██╗ ██████╗ ███╗   ██╗    
	// ██╔════╝██╔══██╗████╗  ██║████╗  ██║██╔═══██╗████╗  ██║    
	// ██║     ███████║██╔██╗ ██║██╔██╗ ██║██║   ██║██╔██╗ ██║    
	// ██║     ██╔══██║██║╚██╗██║██║╚██╗██║██║   ██║██║╚██╗██║    
	// ╚██████╗██║  ██║██║ ╚████║██║ ╚████║╚██████╔╝██║ ╚████║    
	//  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═══╝    
	//
	
	// Setup our world
	const world: CANNON.World = new CANNON.World()
	world.gravity.set(0, -9.82, 0) // m/s²

	// Add invisible colliders
	loadColliders(world)

	// Define a physics material: Ground
	const groundPhysicsMaterial = new CANNON.Material('groundMaterial')
	const groundPhysicsContactMaterial = new CANNON.ContactMaterial(groundPhysicsMaterial, groundPhysicsMaterial, {
		friction: 0.5,
		restitution: 0.33
	})
	world.addContactMaterial(groundPhysicsContactMaterial)

	// Create a ground plane and apply physics material
	const groundBody: CANNON.Body = new CANNON.Body({
		mass: 0 // mass === 0 makes the body static
	})
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis

	const groundShape: CANNON.Plane = new CANNON.Plane()
	groundBody.addShape(groundShape)
	groundBody.material = groundPhysicsMaterial
	world.addBody(groundBody)

	const ballPhysicsMaterial: CANNON.Material = new CANNON.Material('ballMaterial')
	ballPhysicsMaterial.friction = 1
	ballPhysicsMaterial.restitution = 1
	const ballPhysicsContactMaterial = new CANNON.ContactMaterial(groundPhysicsMaterial, ballPhysicsMaterial, {
		friction: 1.0,
		restitution: 0.5
	})
	world.addContactMaterial(ballPhysicsContactMaterial)

	// Create bodies to represent each of the balls
	for (let i = 0; i < balls.length; i++) {
		const ballTransform = Transform.get(balls[i].entity)
 
		const ballBody: CANNON.Body = new CANNON.Body({
			mass    : 5, // kg
			position: new CANNON.Vec3(ballTransform.position.x, ballTransform.position.y, ballTransform.position.z), // m
			shape   : new CANNON.Sphere(0.5) 
		})

		ballBody.material       = ballPhysicsMaterial // Add bouncy material to ball body
		ballBody.linearDamping  = 0.0 // Round will keep translating even with friction so you need linearDamping
		ballBody.angularDamping = 0.4 // Round bodies will keep rotating even with friction so you need angularDamping

		world.addBody(ballBody) // Add body to the world
		ballBodies.push(ballBody)
	}

	//      ██╗███████╗ ██████╗ ███╗   ██╗     ██████╗ ██████╗ ██╗     ██╗     ██╗██████╗ ███████╗██████╗ ███████╗
	//      ██║██╔════╝██╔═══██╗████╗  ██║    ██╔════╝██╔═══██╗██║     ██║     ██║██╔══██╗██╔════╝██╔══██╗██╔════╝
	//      ██║███████╗██║   ██║██╔██╗ ██║    ██║     ██║   ██║██║     ██║     ██║██║  ██║█████╗  ██████╔╝███████╗
	// ██   ██║╚════██║██║   ██║██║╚██╗██║    ██║     ██║   ██║██║     ██║     ██║██║  ██║██╔══╝  ██╔══██╗╚════██║
	// ╚█████╔╝███████║╚██████╔╝██║ ╚████║    ╚██████╗╚██████╔╝███████╗███████╗██║██████╔╝███████╗██║  ██║███████║
	//  ╚════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
	//                                                                                                            

	loadCollidersFromJSON(world);



	// ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗
	// ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
	// ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗  
	// ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝  
	// ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗
	//  ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
	//                                                   
	
	const fixedTimeStep: number = 1.0 / 60.0 // seconds
	const maxSubSteps: number = 3

	function updateSystem(dt: number): void {
		// Instruct the world to perform a single step of simulation.
		// It is generally best to keep the time step and iterations fixed.
		world.step(fixedTimeStep, dt, maxSubSteps)

		// Position and rotate the balls in the scene to match their cannon world counterparts
		for (let i = 0; i < balls.length; i++) {
			const ballTransform    = Transform.getMutable(balls[i].entity)
			if (ballTransform && ballTransform.position) {
				ballTransform.position = ballBodies[i].position
				ballTransform.rotation = ballBodies[i].quaternion
			}
		}

		// Update forward vector
		forwardVector = Vector3.rotate(Vector3.Forward(), Transform.get(engine.CameraEntity).rotation)
		// console.log('Forward Vector: ', forwardVector)
	}

	engine.addSystem(updateSystem)
}