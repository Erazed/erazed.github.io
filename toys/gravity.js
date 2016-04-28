function gravitySimulator() {
    var colours = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var canvasBoundingRect = canvas.getBoundingClientRect();

    var tick = 5;
    var drawInterval = setInterval(draw, tick);
    var previousFrameTime = Date.now();

    var planets = new Set();
    var planetUnderCreation;
    var growthRate = 0.02;
    var maxRadius = 75;
    var densityFactor = 1;

    var gravitationalConstant = 0.005;

    canvas.addEventListener("mousedown", mouseDownHandler);
    canvas.addEventListener("mouseup", mouseUpHandler);

    document.getElementById("addSolarSystemButton").addEventListener("click", addSolarSystem);
    document.getElementById("clearButton").addEventListener("click", clear);

	addSolarSystem();

    function planet(radius, x, y, dx, dy, fixed) {
        this.radius = radius;
        this.colour = {r:4 *(-Math.pow(this.radius/maxRadius, 2) + this.radius/maxRadius),
            g:this.radius/(1.5*maxRadius), b:this.radius/maxRadius};
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.mass = Math.pow(radius, 3) * densityFactor;
        this.fixed = fixed;
        this.applyGravity = function() {
        	var acceleration = getNetAcceleration(this);
        	if(!this.fixed) {
            	this.dx += acceleration.x;
            	this.dy += acceleration.y;
        	}
        }
        this.move = function() {
        	if(!this.fixed) {
            	this.x += this.dx;
            	this.y += this.dy;
        	}
        }
        this.grow = function() {
            this.radius += (this.radius * growthRate);
            if (this.radius > maxRadius) {
                this.radius = maxRadius;
            }
            this.mass = Math.pow(this.radius, 3) * densityFactor;
            this.colour = {r:4 *(-Math.pow(this.radius/maxRadius, 2) + this.radius/maxRadius),
            g:this.radius/(1.5*maxRadius), b:this.radius/maxRadius};
        }

        this.getColour = function() {
        	return "rgb(" + Math.round(255 * this.colour.r) + ", "
        	 + Math.round(255 * this.colour.g) + ", " + Math.round(255 * this.colour.b) + ")";
        }

        this.eat = function(food) {
        	if(food != planetUnderCreation) {
        		this.mass += food.mass;
        		this.radius = Math.pow(this.mass, 1/3) / densityFactor;
				this.colour = {r:4 *(-Math.pow(this.radius/maxRadius, 2) + this.radius/maxRadius),
 				g:this.radius/(1.5*maxRadius), b:this.radius/maxRadius};
        		this.dx += food.dx * (food.mass/this.mass);
        		planets.delete(food);
        	}
        }
    }

    function getNetAcceleration(targetPlanet) {
        var acceleration = {
            x: 0,
            y: 0
        }
        var actingPlanets = [];
        if (planetUnderCreation != undefined) {
            actingPlanets.push(planetUnderCreation);
        }
        planets.forEach(function(planet) {
            if (planet != targetPlanet) {
                actingPlanets.push(planet);
            }
        });
        actingPlanets.forEach(function(actingPlanet) {
            var distance = getDistanceBetweenTwoPlanets(targetPlanet, actingPlanet);
            if(distance < targetPlanet.radius && targetPlanet.mass >= actingPlanet.mass) {
            	targetPlanet.eat(actingPlanet);
            }
            var magnitude = getMagnitudeAcceleration(actingPlanet, distance);
            var xDirection = (actingPlanet.x - targetPlanet.x) / distance;
            var yDirection = (actingPlanet.y - targetPlanet.y) / distance;
            acceleration.x += (xDirection * magnitude);
            acceleration.y += (yDirection * magnitude);
        });
        return acceleration;
    }

    function getDistanceBetweenTwoPlanets(planet1, planet2) {
        return Math.sqrt(Math.pow(planet1.x - planet2.x, 2) + Math.pow(planet1.y - planet2.y, 2))
    }

    function getMagnitudeAcceleration(actingPlanet, distance) {
        return gravitationalConstant * actingPlanet.mass / Math.pow(distance, 2);
    }

    function mouseDownHandler(mouseDownEvent) {
        var x = mouseDownEvent.layerX;
        var y = mouseDownEvent.layerY;
        if (mouseDownEvent.which == 1) {
        	clearInterval(drawInterval);
            drawInterval = setInterval(draw, tick);
            canvas.addEventListener("mousemove", mouseMoveHandler);
            planetUnderCreation = new planet(1, x, y, 0, 0, false);

        } else if (mouseDownEvent.which == 2) {
            clearInterval(drawInterval);

            console.log("##### PAUSED #####")
            console.log(drawInterval);

            planets.forEach(function(planet) {
                if (Math.abs(planet.x - x) < 40 && Math.abs(planet.y - y) < 40) {
                    console.log(planet);
                }
            })

            context.beginPath();
            context.arc(x, y, 40, 0, Math.PI * 2);
            context.strokeStyle = "black";
            context.stroke();
            context.closePath();

        } else if (mouseDownEvent.which == 3) {
            clearInterval(drawInterval);
            drawInterval = setInterval(draw, tick);
            planetUnderCreation = new planet(1, x, y, 0, 0, true);
        }
    }

    function mouseUpHandler(mouseUpEvent) {
        if (mouseUpEvent.which == 1) {
            planets.add(planetUnderCreation);
            planetUnderCreation = undefined;
            canvas.removeEventListener("mousemove", mouseMoveHandler);
        } else if (mouseUpEvent.which == 3) {
        	planets.add(planetUnderCreation);
            planetUnderCreation = undefined;
        }
    }

    function mouseMoveHandler(mouseMoveEvent) {
        planetUnderCreation.x = mouseMoveEvent.layerX;
        planetUnderCreation.y = mouseMoveEvent.layerY;
        planetUnderCreation.dx = mouseMoveEvent.movementX * 0.2;
        planetUnderCreation.dy = mouseMoveEvent.movementY * 0.2;

    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawExistingPlanets();
        drawPlanetUnderCreation();
        drawDebugInfo();
    }

    function drawExistingPlanets() {
        planets.forEach(function(planet) {
            planet.applyGravity();
            planet.move();
            context.beginPath();
            context.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            context.fillStyle = planet.getColour();
            context.fill();
            context.closePath();
            if(planet.fixed) {
            	context.beginPath();
            	context.arc(planet.x, planet.y, planet.radius / 2, 0, Math.PI * 2);
            	context.fillStyle = "black";
            	context.fill();
            	context.closePath();
            }
            
        });
    }

    function drawPlanetUnderCreation() {
        if (planetUnderCreation != undefined) {
            planetUnderCreation.grow();
            context.beginPath();
            context.arc(planetUnderCreation.x, planetUnderCreation.y, planetUnderCreation.radius, 0, Math.PI * 2);
            context.fillStyle = planetUnderCreation.getColour();
            context.fill();
            context.closePath();
            if(planetUnderCreation.fixed) {
            	context.beginPath();
            	context.arc(planet.x, planet.y, planetUnderCreation.radius / 2, 0, Math.PI * 2);
            	context.fillStyle = "black";
            	context.fill();
            	context.closePath();
            }
        }
    }

    function drawDebugInfo() {
        var now = Date.now();
        context.font = "12px calibri";
        context.fillStyle = "black";
        context.fillText("Planets: " + planets.size, 5, 12);
        context.fillText("Frame delay: " + (now - previousFrameTime), 5, 24);
        if (planetUnderCreation != undefined) {
            context.fillText("Growing planet at: (" + planetUnderCreation.x + "," + planetUnderCreation.y + ")", 5, 36);
        }
        previousFrameTime = now;
    }

    function clear() {
    	planets.clear();
    }

    function addSolarSystem() {
    	clear();
    	planets.add(new planet(60, 600, 350, 0, 0, true));
    	planets.add(new planet(20, 200, 350, 0, 1.7, false));
    	planets.add(new planet(2, 150, 350, 0, 2.6, false));
    	console.log(planets);
    }
}
