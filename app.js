var canvas;
var activeProgram;
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
    gl.frontFace(gl.CCW);
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
    
    const targetTextureHeight = 600;
    const targetTextureWidth = 800;
    const targetTexture = gl.createTexture();
    
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

    //create and bind a framebuffer
    const fb = createFrameBuffer();
    bindFramebufferAndSetViewport(fb, targetTextureWidth, targetTextureHeight);

    //attach texture as a first color attachment
    gl.attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

    //create an an array buffer for points
    //var pointsBufferObject = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferObject);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null);


    function drawDrawing(program){
        gl.useProgram(program);
        activeProgram = program;

        //gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferObject);
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        // var pointAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        // var colorAttribPointer = gl.getAttribLocation(program, 'vertColor');

        // gl.vertexAttribPointer(
        //     pointAttribLocation,
        //     3,
        //     gl.FLOAT,
        //     gl.FALSE,
        //     3*Float32Array.BYTES_PER_ELEMENT,
        //     0
        // );

        // gl.enableVertexAttribArray(pointAttribLocation);

        
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);



        gl.drawArrays(gl.POINTS, 0, (points.length/3));//p1: the type of the object you're gonna draw, gonna be triangle 99% of the time, p2: how many points do you wanna skip? in this case none, so 0. p3: how many points do you wanna draw? in this case 3.
    
    }
    
    var running = true;
    var loop = function () {

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        drawDrawing();
        // gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
        if (running) {
            requestAnimationFrame(loop);
        }
    }
    requestAnimationFrame(loop);
};

var mousePressed = false;
var points = [];

var mouseDown = function(event){
    canvas = document.getElementById('draw-surface');

    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('Webgl not supported without exprimental context.');
        gl.getContext('experimental-webgl');
    }

    if(!gl){
        alert('your browser does not support webGL');
    }
    mousePressed = true;
    var mouseX = parseInt(event.x - (canvas.width/2)) / (canvas.width/2);
    var mouseY = parseInt(-event.y + (canvas.height/2)) / (canvas.height/2);
    gl.uniform3fv(gl.getUniformLocation('vertPosition'), vec3(mouseX, mouseY, 0.0));
    // points.pop();
    // points.pop();
    // points.pop();
    // points.push(mouseX);
    // points.push(mouseY);
    // points.push(0.0);
    // console.log(points);
};

var mouseDragged =  function(event){
    canvas = document.getElementById('draw-surface');

    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('Webgl not supported without exprimental context.');
        gl.getContext('experimental-webgl');
    }

    if(!gl){
        alert('your browser does not support webGL');
    }
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
    mousePressed = false;
    console.log(points);
};

var bindFramebufferAndSetViewport = function(fb, width, height) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, width, height);
 }