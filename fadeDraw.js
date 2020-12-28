var canvas;
var draw = false;
var initDraw = function(){
    console.log("This is working!");

    canvas = document.getElementById('draw-surface');

    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('Webgl not supported without exprimental context.');
        gl.getContext('experimental-webgl');
    }

    if(!gl){
        alert('your browser does not support webGL');
    }

    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CW);
    gl.cullFace(gl.BACK);

    //function to create a new program, make shaders from text, attach those shaders to the programs made
    var createProgram = function(vertexShaderText, fragmentShaderText){
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, vertexShaderText);
        gl.shaderSource(fragmentShader, fragmentShaderText);

        gl.compileShader(vertexShader);

        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
            console.error('ERROR COMPILING THE VERTEX SHADER!', gl.getShaderInfoLog(vertexShader));
            return;
        }

        gl.compileShader(fragmentShader);
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
            console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
            return;
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('ERROR linking program!', gl.getProgramInfoLog(program));
            return;
        }
        gl.validateProgram(program);
        if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
            console.error('ERROR validating program!', gl.getProgramInfoLog(program));
            return;
        }
        return program;
    }

    var textureProgram = createProgram(document.getElementById("vertexShader").innerHTML, document.getElementById("fragmentShader").innerHTML);
    var fadeProgram = createProgram(document.getElementById("fadeVertexShader").innerHTML, document.getElementById("fadeFragmentShader").innerHTML);
    var displayProgram = createProgram(document.getElementById("displayVertexShader").innerHTML, document.getElementById("displayFragmentShader").innerHTML);
    var advectProgram = createProgram(document.getElementById("baseVertexShader", document.getElementById("advectShader")));

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    {
    // fill texture with 3x2 pixels
    const level = 0;
    const internalFormat = gl.RGBA;
    // const width = 800;
    // const height = 600;
    // const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = document.getElementById('ind-image');
    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, /*width, height, border,*/
                  format, type, data);

    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    const targetTextureHeight = 600;
    const targetTextureWidth = 800;
    var targetTexture = gl.createTexture();
    
    var bindFramebufferAndSetViewport = function(fb, width, height) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, width, height);
    }

    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
        // define size and format of level 0
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        targetTextureWidth, targetTextureHeight, border,
                        format, type, data);
        
        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    //create and bind a framebuffer
    var bufferToTargetTexture = gl.createFramebuffer();
    bindFramebufferAndSetViewport(bufferToTargetTexture, targetTextureWidth, targetTextureHeight);

    //attach texture as a first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);


    //createFrameBuffer2
    var bufferToTexture = gl.createFramebuffer();
    bindFramebufferAndSetViewport(bufferToTexture, targetTextureWidth, targetTextureHeight);
    // attach texture as a first color attachment
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, level);


    var quad = [
        1.0, 1.0, 0.0,    /*1.0, 0.6, 0.4,*/    1, 1,
		1.0, -1.0, 0.0,   /*1.0, 0.9, 0.9,*/    1, 0,
		-1.0, -1.0, 0.0,  /*0.05, 0.0, 0.15,*/  0, 0,
        -1.0, 1.0, 0.0,   /*0.8, 0.3, 0.6,*/    0, 1];

    var indices = [0, 1, 2,
                   0, 2, 3];

    //create an an array buffer for points
    var pointsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    var indicesBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    

    gl.useProgram(textureProgram);
    function fadeDrawing(program){
        gl.useProgram(program);
        // activeProgram = program;
        var vertexAttribLocation = gl.getAttribLocation(program, 'boxPosition');
        var textureAttribLocation = gl.getAttribLocation(program, 'boxTexCoord');
        gl.vertexAttribPointer(
            vertexAttribLocation, // Attribute Location
            3, // Number of elements per attribute
            gl.FLOAT, // type of elements
            gl.FALSE,
            5* Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the begining of a single vertex of this attribute
        )
        
        gl.vertexAttribPointer(
            textureAttribLocation, // Attribute Location
            2, // Number of elements per attribute
            gl.FLOAT, // type of elements
            gl.FALSE,
            5* Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            3* Float32Array.BYTES_PER_ELEMENT // Offset from the begining of a single vertex of this attribute
        )
        
        gl.enableVertexAttribArray(vertexAttribLocation);
        gl.enableVertexAttribArray(textureAttribLocation);

        
        //gl.uniform1f(gl.getUniformLocation(program, 'time'), performance.now()/1000);
        
        
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);//p1: the type of the object you're gonna draw, gonna be triangle 99% of the time, p2: how many points do you wanna skip? in this case none, so 0. p3: how many points do you wanna draw? in this case 3.
        // gl.drawArrays(gl.POINTS, 0, 0);
    }

    function drawDrawing(program){
        gl.useProgram(program);
        // activeProgram = program;
        if(draw){
            gl.uniform3f(gl.getUniformLocation(program, 'vertPosition'), points[0], points[1], points[2]);
        //gl.uniform3f(gl.getUniformLocation(program, 'color'), 1.0, 0.0, 0.0);
        }
        
        //gl.uniform1f(gl.getUniformLocation(program, 'time'), performance.now()/1000);
        
        if(points.length!=0){
        gl.drawArrays(gl.POINTS, 0, 1);//p1: the type of the object you're gonna draw, gonna be triangle 99% of the time, p2: how many points do you wanna skip? in this case none, so 0. p3: how many points do you wanna draw? in this case 3.
        // gl.drawArrays(gl.POINTS, 0, 0);
        }
    }
    
    var running = true;
    var firstPass = true;

    var i=0;
    var activeFrameBuffer = [bufferToTargetTexture, bufferToTexture];
    var activeTexture = [texture, targetTexture]

    var loop = function () {
        ///draw the first primitive
        gl.bindFramebuffer(gl.FRAMEBUFFER, activeFrameBuffer[i%2]);
        gl.bindTexture(gl.TEXTURE_2D, activeTexture[i%2]);
        // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        
        if(firstPass)
        {
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT); //gl.clear clears the target texture that you have set as the frame buffer to the clear color (target texture can be a texture that you created or the display. your problem was that you cleared yout target texture and therefore cleared the points that were rendered to it in the previous iteration. so possibly, you might not wanna clear ant texture except for the display.)
            // firstPass=false;
        }
        fadeDrawing(displayProgram);

        //fade the texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, activeFrameBuffer[(i+1)%2]);
        gl.bindTexture(gl.TEXTURE_2D, activeTexture[(i+1)%2]);
        if(firstPass){
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            firstPass=false;
        }

        fadeDrawing(fadeProgram);


        // //display the texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, activeTexture[(i)%2]);
        gl.clearColor(0.5, 0.0, 0.5, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        fadeDrawing(displayProgram);
        // gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
        
        

        //switch the two textures
        // i+=1;
        // var temp = texture1;
        // texture2=texture1;
        // texture1=temp;

        if (running) {
            requestAnimationFrame(loop);
        }
    }
    requestAnimationFrame(loop);
};

var mousePressed = false;
var points = [];

var mouseDown = function(event){
    draw = true;
    mousePressed = true;
    var mouseX = parseInt(event.x - (canvas.width/2)) / (canvas.width/2);
    var mouseY = parseInt(-event.y + (canvas.height/2)) / (canvas.height/2);
    console.log('mouse Pressed: ', mouseX, " ", mouseY);
    points.pop();
    points.pop();
    points.pop();
    points.push(mouseX);
    points.push(mouseY);
    points.push(0.0);
    
};

var mouseDragged =  function(event){
    canvas = document.getElementById('draw-surface');
    var mouseX = parseInt(event.x - (canvas.width/2)) / (canvas.width/2);
    var mouseY = parseInt(-event.y + (canvas.height/2)) / (canvas.height/2);
    if(mousePressed){
        points.pop();
        points.pop();
        points.pop();
        points.push(mouseX);
        points.push(mouseY);
        points.push(0.0);
    }
};

var mouseUp = function(event){
    draw=false;
    mousePressed = false;
    console.log(points);
    points.pop();
    points.pop();
    points.pop();
};

