(function (window, document) {

	'use strict';

	function PongJS () {

		var game = this; // For internal reference

		game.utils = {

			getDocumentWidth : function () {
				return 600;
				/* return Math.max(
					document.body.scrollWidth, document.documentElement.scrollWidth,
					document.body.offsetWidth, document.documentElement.offsetWidth,
					document.body.clientWidth, document.documentElement.clientWidth
				); */
			},

			getDocumentHeight : function () {
				return 800;
				/* return Math.max(
					document.body.scrollHeight, document.documentElement.scrollHeight,
					document.body.offsetHeight, document.documentElement.offsetHeight,
					document.body.clientHeight, document.documentElement.clientHeight
				); */
			},

			rand : function (minimum, maximum) {
				return Math.floor(minimum + Math.random() * (maximum - minimum + 1));
			}

		}; // game.utils

		game.settings = {

			debug : {
				color : '#ff00ff',
				font  : '14px Consolas, monospace'
			},

			context : {
				color  : '#222222',
				width  : game.utils.getDocumentWidth(),
				height : game.utils.getDocumentHeight()
			},

			border : {
				color : '#ffffff',
				dash  : [3],
				width : 1
			},

			paddle : {
				color  :'#00ff00',
				width  : 75,
				height : 10,
				stroke : 2,
				speed : {
					x : 7,
					y : 0
				}
			},

			ball : {
				color  : '#00ff00',
				radius : 5,
				x : (game.utils.getDocumentWidth() / 2),  // Half window width
				y : (game.utils.getDocumentHeight() / 2), // Half window height
				speed : {
					x : 0,
					y : 6
				}
			},

			score : {
				color : '#ffffff',
				font  : '30px Consolas, monospace'
			},

			player : {
				paddle : {
					x : (game.utils.getDocumentWidth() / 2) - 37.5, // Half window width minus half paddle width
					y : (game.utils.getDocumentHeight() - 10) - 10, // Window height minus double paddle height
					stroke : false
				},
				score : {
					x : 30,
					y : (game.utils.getDocumentHeight() - 30)
				}
			},

			computer : {
				paddle : {
					x : (game.utils.getDocumentWidth() / 2) - 37.5, // Half window width minus half paddle width
					y : 10,                                         // Paddle height
					stroke : true
				},
				score : {
					x : 30,
					y : 49
				}
			},

			beep : {
				type   : 0,
				volume : 0.2
			}

		}; // game.settings

		game.objects = {

			paddle : {

				instance : function (x, y, stroke) {
					this.x = x;
					this.y = y;
					this.width  = game.settings.paddle.width;
					this.height = game.settings.paddle.height;
					this.stroke = stroke;
					this.speed = {
						x : 0,
						y : game.settings.paddle.speed.y
					};
				},

				move : function (paddle, x, y) {
					paddle.x += x;
					paddle.y += y;
					paddle.speed.x = x;
					paddle.speed.y = y;

					// Stop paddle if it hits the left wall
					if (paddle.x < 1) {
						paddle.x = 1;
					}

					// Stop paddle if it hits the right wall
					if (paddle.x + paddle.width > game.settings.context.width) {
						paddle.x = game.settings.context.width - paddle.width;
					}
				},

				render : function (paddle) {
					if (paddle.stroke) {
						game.ui.context.lineWidth = game.settings.paddle.stroke;
						game.ui.context.strokeStyle = game.settings.paddle.color;
						game.ui.context.strokeRect(paddle.x, paddle.y, paddle.width - game.settings.paddle.stroke, paddle.height - game.settings.paddle.stroke);
					} else {
						game.ui.context.fillStyle = game.settings.paddle.color;
						game.ui.context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
					}
				}

			}, // game.objects.paddle

			ball : {

				instance : function () {
					this.x = game.settings.ball.x;
					this.y = game.settings.ball.y;
					this.radius = game.settings.ball.radius;
					this.speed = {
						x : game.settings.ball.speed.x,
						y : game.settings.ball.speed.y
					};
				},

				update : function (ball, player, computer) {
					ball.x += ball.speed.x;
					ball.y += ball.speed.y;
					ball.left   = ball.x - game.settings.ball.radius;
					ball.top    = ball.y - game.settings.ball.radius;
					ball.right  = ball.x + game.settings.ball.radius;
					ball.bottom = ball.y + game.settings.ball.radius;

					// Stop ball if it hits the left wall and invert its X speed
					if (ball.left < 0) {
						ball.x = game.settings.ball.radius;
						ball.speed.x = -ball.speed.x;
					}

					// Stop ball if it hits the right wall and invert its X speed
					if (ball.right > game.settings.context.width) {
						ball.x = game.settings.context.width - game.settings.ball.radius;
						ball.speed.x = -ball.speed.x;
					}

					// If a point was scored
					if ((ball.y < 0 || ball.y > game.settings.context.height) && !game.scoreTime) {
						game.scoreTime = (typeof game.scoreTime === 'undefined') ? new Date().getTime() : game.scoreTime;

						// Update score value and set new ball direction
						if (ball.y < 0) {
							player.score.value ++;
							ball.direction = -1;
						} else if (ball.y > game.settings.context.height) {
							computer.score.value ++;
							ball.direction = 1;
						}

						// Stop ball
						ball.speed.x = 0;
						ball.speed.y = 0;

						// Reset ball position
						ball.x = game.settings.ball.x;
						ball.y = game.settings.ball.y;

						// Reset paddle positions
						// player.paddle.x = game.settings.player.paddle.x;
						// player.paddle.y = game.settings.player.paddle.y;
						// computer.paddle.x = game.settings.computer.paddle.x;
						// computer.paddle.y = game.settings.computer.paddle.y;
					}

					// Set random ball speed after 500 ms
					if (game.scoreTime && new Date().getTime() - game.scoreTime >= 500) {
						ball.speed.x = game.utils.rand(-game.settings.ball.speed.y / 2, game.settings.ball.speed.y / 2);
						ball.speed.y = ball.direction * game.settings.ball.speed.y;
						delete game.scoreTime;
					}

					// If ball hits the player's paddle
					if (ball.top > game.settings.ball.y) {
						if (ball.top < (player.paddle.y + player.paddle.height) && ball.bottom > player.paddle.y && ball.left < (player.paddle.x + player.paddle.width) && ball.right > player.paddle.x) {
							ball.speed.x += (player.paddle.speed.x / 2); // Increase ball X speed by half of the paddle's X speed
							ball.speed.y = -game.settings.ball.speed.y;  // Invert ball Y speed
							ball.y += ball.speed.y;                      // Increase ball Y position by its Y speed
							game.sound.beep(440, 100);
						}
					}

					// If ball hits the computers's paddle
					if (ball.bottom < game.settings.ball.y) {
						if (ball.top < (computer.paddle.y + computer.paddle.height) && ball.bottom > computer.paddle.y && ball.left < (computer.paddle.x + computer.paddle.width) && ball.right > computer.paddle.x) {
							ball.speed.x += (computer.paddle.speed.x / 2); // Increase ball X speed by half of the paddle's X speed
							ball.speed.y = game.settings.ball.speed.y;     // Invert ball Y speed
							ball.y += ball.speed.y;                        // Increase ball Y position by its Y speed
							game.sound.beep(660, 100);
						}
					}
				},

				render : function (paddle) {
					game.ui.context.beginPath();
					game.ui.context.arc(paddle.x, paddle.y, paddle.radius, 2 * Math.PI, false);
					game.ui.context.fillStyle = game.settings.ball.color;
					game.ui.context.fill();
				}

			}, // game.objects.ball

			score : {

				instance : function (x, y) {
					this.x = x;
					this.y = y;
					this.value = 0;
				},

				render : function (score) {
					game.ui.context.font = game.settings.score.font;
					game.ui.context.fillStyle = game.settings.score.color;
					game.ui.context.fillText(score.value, score.x, score.y);
				}

			} // game.objects.score

		}; // game.objects

		game.player = {

			paddle : new game.objects.paddle.instance(game.settings.player.paddle.x, game.settings.player.paddle.y, game.settings.player.paddle.stroke),
			score  : new game.objects.score.instance(game.settings.player.score.x, game.settings.player.score.y),

			update : function () {
				for (var key in game.core.keysDown) {
					switch (Number(key)) {
						case game.core.keys.ARROW_LEFT:
							game.objects.paddle.move(this.paddle, -game.settings.paddle.speed.x, game.settings.paddle.speed.y);
							break;
						case game.core.keys.ARROW_RIGHT:
							game.objects.paddle.move(this.paddle, game.settings.paddle.speed.x, game.settings.paddle.speed.y);
							break;
					}
				}
			},

			render : function () {
				game.objects.paddle.render(this.paddle);
				game.objects.score.render(this.score);
			}

		}; // game.player

		game.computer = {

			paddle : new game.objects.paddle.instance(game.settings.computer.paddle.x, game.settings.computer.paddle.y, game.settings.computer.paddle.stroke),
			score  : new game.objects.score.instance(game.settings.computer.score.x, game.settings.computer.score.y),

			update : function (ball) {
				// Calculate the X difference between the paddle's and the ball's center
				var difference = -((this.paddle.x + (this.paddle.width / 2)) - ball.x);

				// Set maximum paddle speed according to the difference
				if (difference < 0 && difference < -game.settings.paddle.speed.x) {
					difference = -(game.settings.paddle.speed.x + 1); // Maximum speed left
				} else if (difference > 0 && difference > game.settings.paddle.speed.x) {
					difference = (game.settings.paddle.speed.x + 1); // Maximum speed right
				}

				game.objects.paddle.move(this.paddle, difference, game.settings.paddle.speed.y);
			},

			render : function () {
				game.objects.paddle.render(this.paddle);
				game.objects.score.render(this.score);
			}

		}; // game.computer

		game.ball = {

			ball : new game.objects.ball.instance(),

			update : function (player, computer) {
				game.objects.ball.update(this.ball, player, computer);
			},

			render : function () {
				game.objects.ball.render(this.ball);
			}

		}; // game.ball

		game.ui = {

			animate : function (callback) {
				window.requestAnimationFrame(callback)       ||
				window.webkitRequestAnimationFrame(callback) ||
				window.mozRequestAnimationFrame(callback)    ||
				window.msRequestAnimationFrame(callback)     ||
				window.oRequestAnimationFrame(callback)      ||
				function (callback) {
					window.setTimeout(callback, 1000 / 60);
				};

				game.ui.fps = 1 / ((new Date().getTime() - game.ui.frameTime) / 1000);
			},

			update : function () {
				game.player.update();
				game.computer.update(game.ball.ball);
				game.ball.update(game.player, game.computer);
			},

			render : function () {
				// Overlay
				if (game.core.running) {
					game.ui.overlay.style.display = 'none';
				} else if (!game.core.running) {
					game.ui.overlay.style.display = 'block';
				}

				// Canvas context
				game.ui.context = game.ui.canvas.getContext('2d');

				// Background
				game.ui.context.fillStyle = game.settings.context.color;
				game.ui.context.fillRect(0, 0, game.settings.context.width, game.settings.context.height);

				// Horizontal lines
				game.ui.context.beginPath();
				game.ui.context.moveTo(0, 0.5);
				game.ui.context.lineTo(game.settings.context.width, 0.5);
				game.ui.context.moveTo(0, (game.settings.context.height / 2) + 0.5);
				game.ui.context.lineTo(game.settings.context.width, (game.settings.context.height / 2) + 0.5);
				game.ui.context.moveTo(0, game.settings.context.height - 0.5);
				game.ui.context.lineTo(game.settings.context.width, game.settings.context.height - 0.5);
				game.ui.context.setLineDash(game.settings.border.dash);
				game.ui.context.lineDashOffset = 1;
				game.ui.context.lineWidth = game.settings.border.width;
				game.ui.context.strokeStyle = game.settings.border.color;
				game.ui.context.stroke();

				// Vertical lines
				game.ui.context.beginPath();
				game.ui.context.moveTo(0.5, 0);
				game.ui.context.lineTo(0.5, game.settings.context.height);
				game.ui.context.moveTo(game.settings.context.width - 0.5, 0);
				game.ui.context.lineTo(game.settings.context.width - 0.5, game.settings.context.height);
				game.ui.context.setLineDash([]);
				game.ui.context.lineWidth = game.settings.border.width;
				game.ui.context.strokeStyle = game.settings.border.color;
				game.ui.context.stroke();

				// Objects
				game.player.render();
				game.computer.render();
				game.ball.render();
			},

			frame : function () {
				if (game.core.running) game.ui.update();
				game.ui.render();
				game.ui.animate(game.ui.frame);
				game.ui.frameTime = new Date().getTime();

				if (window.location.href.toString().match(/debug/i)) game.debug.output();
			}

		}; // game.ui

		game.sound = {

			init : function () {
				if (window.AudioContext || window.webkitAudioContext) {
					game.sound.context = window.AudioContext ? new window.AudioContext() : new window.webkitAudioContext();
					game.sound.gain = game.sound.context.createGain();
					game.sound.oscillator = game.sound.context.createOscillator();
					game.sound.gain.connect(game.sound.context.destination);
					game.sound.oscillator.connect(game.sound.gain);
					game.sound.gain.gain.value = 0;
					game.sound.oscillator.type = game.settings.beep.type;
					game.sound.oscillator.frequency.value = 660;
					game.sound.oscillator.start(0);
				}
			},

			beep : function (frequency, duration) {
				game.sound.gain.gain.value = game.settings.beep.volume;

				// Play beep
				window.setTimeout(function () {
					game.sound.oscillator.frequency.value = frequency;
				}, duration);

				// Stop beep
				window.setTimeout(function () {
					game.sound.gain.gain.value = 0;
				}, duration);
			}

		}; // game.sound

		game.debug = {

			output : function () {
				game.ui.context.font = game.settings.debug.font;
				game.ui.context.fillStyle = game.settings.debug.color;
				game.ui.context.fillText('Frames per second : ' + game.ui.fps.toFixed(1),       game.settings.context.width-225,  30);
				game.ui.context.fillText('Computer position : ' + game.computer.paddle.x,       game.settings.context.width-225,  60);
				game.ui.context.fillText('Computer speed    : ' + game.computer.paddle.speed.x, game.settings.context.width-225,  75);
				game.ui.context.fillText('Ball X position   : ' + game.ball.ball.x,             game.settings.context.width-225, 105);
				game.ui.context.fillText('Ball Y position   : ' + game.ball.ball.y,             game.settings.context.width-225, 120);
				game.ui.context.fillText('Ball X speed      : ' + game.ball.ball.speed.x,       game.settings.context.width-225, 135);
				game.ui.context.fillText('Ball Y speed      : ' + game.ball.ball.speed.y,       game.settings.context.width-225, 150);
				game.ui.context.fillText('Player position   : ' + game.player.paddle.x,         game.settings.context.width-225, 180);
				game.ui.context.fillText('Player speed      : ' + game.player.paddle.speed.x,   game.settings.context.width-225, 195);
			}

		}; // game.debug

		game.core = {

			running : false,

			init : function () {
				game.ui.overlay = document.createElement('div');
				game.ui.overlay.className = 'overlay';
				document.body.appendChild(game.ui.overlay);

				game.ui.canvas = document.createElement('canvas');
				game.ui.canvas.width = game.settings.context.width;
				game.ui.canvas.height = game.settings.context.height;

				document.body.appendChild(game.ui.canvas);
				document.body.style.background = game.settings.context.color;

				if (window.location.href.toString().match(/mobile/i)) {
					game.ui.canvas.style.width = '90%';
					game.ui.canvas.style.height = '90%';
				}

				game.core.events.bind();
			},

			events : {

				bind : function () {
					window.addEventListener('load', function () {
						game.ui.animate(game.ui.frame);
						game.sound.init();
					});

					window.addEventListener('keydown', function (event) {
						game.core.keysDown[event.keyCode] = true;
						if (event.keyCode === game.core.keys.SPACE) game.core.running = !game.core.running;
					});

					window.addEventListener('keyup', function (event) {
						delete game.core.keysDown[event.keyCode];
					});

					window.addEventListener('touchstart', function (event) {
						event.preventDefault();
						for (var i = 0; i < event.changedTouches.length; i ++) {
							var touch = event.changedTouches[i];
							game.core.touches[touch.identifier] = {
								x : touch.clientX,
								y : touch.clientY
							};
						}
					});

					window.addEventListener('touchmove', function (event) {
						event.preventDefault();
						for (var i = 0; i < event.changedTouches.length; i ++) {
							var touch = event.changedTouches[i];
							var previousTouch = game.core.touches[touch.identifier];
							game.core.touches[touch.identifier] = {
								x : touch.clientX,
								y : touch.clientY,
								offset : {
									x : touch.clientX - previousTouch.x,
									y : touch.clientY - previousTouch.y
								}
							};
							// Move paddle with touch speed
							game.objects.paddle.move(game.player.paddle, game.core.touches[touch.identifier].offset.x, game.settings.paddle.speed.y);
							// Set default paddle speed, otherwise the ball increases by touch speed
							if (game.core.touches[touch.identifier].offset.x > 0) {
								game.player.paddle.speed.x = game.settings.paddle.speed.x;
							} else if (game.core.touches[touch.identifier].offset.x < 0) {
								game.player.paddle.speed.x = -game.settings.paddle.speed.x;
							}
						}
					});

					window.addEventListener('touchend', function (event) {
						event.preventDefault();
						for (var i = 0; i < event.changedTouches.length; i ++) {
							var touch = event.changedTouches[i];
							delete game.core.touches[touch.identifier];
						}
					});
				}

			},

			keys : {
				SPACE       : 32,
				ARROW_LEFT  : 37,
				ARROW_RIGHT : 39
			},
			keysDown : [],
			touches  : []

		}; // game.core

		(function () {
			game.core.init();
		} ());

	}

	var game = new PongJS();

} (window, document));
