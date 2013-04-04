/*!
	Math Evaluator by morriswmz
	===========================
	Based on http://effbot.org/zone/simple-top-down-parsing.htm
*/
var MathEvaluator = (function () {
	var symbolTable = {},
		mathFunctions = {
			'sin' : Math.sin,
			'cos' : Math.cos,
			'tan' : Math.tan,
			'cot' : function (num) { return 1.0 / Math.tan(num); },
			'asin' : Math.asin,
			'acos' : Math.acos,
			'atan' : Math.atan,
			'atan2' : Math.atan2,
			'sqrt' : Math.sqrt,
			'exp' : Math.exp,
			'log' : Math.log,
			'floor' : Math.floor,
			'round' : Math.round,
			'ceil' : Math.ceil,
			'rand' : function () { return Math.random(); },
			'sum' : function (start, stop, step) {
				var sum = 0, i;
				if (step < 0) step = 0;
				step = step || 1;
				for (i = start;i <= stop;i += step) {
					sum += i;
				}
				return sum;
			}
		};

	// create symbol base class
	function symbol(id, bp) {
		bp = (bp != undefined) ? bp : 0;
		var s = function () {};
		s.prototype.id = id;
		s.prototype.lbp = bp;
		s.prototype.nud = function () {
			throw new Error('Syntax error near %1.'.replace('%1', this.id));
		}
		s.prototype.led = function () {
			throw new Error('Unknown operator %1.'.replace('%1', this.id));
		}
		s.prototype.val = function () {
			throw new Error('Unknown operation with %1.'.replace('%1', this.id));	
		}
		s.prototype._repr = function () {
			var self = this;
			if (self.id == '(literal)') {
				return '(%1 %2)'.replace('%1', self.id)
								.replace('%2', self.value);
			} else {
				var out = [self.id];
				['first', 'second', 'third'].forEach(function (item) {
					if (self[item]) {
						if (self[item]._repr) {
							out.push(self[item]._repr());
						} else {
							out.push(self[item].toString());
						}
					}
				});
				return '(' + out.join(' ') + ')';
			}
		}
		symbolTable[id] = s;
		return s;
	}

	// symbol utils
	function infix(id, bp) {
		var s = symbolTable[id];
		if (s) {
			s.prototype.led = function (left) {
				this.first = left;
				this.second = expression(bp);
				return this;
			}
		}
	}

	function infix_r(id, bp) {
		var s = symbolTable[id];
		if (s) {
			s.prototype.led = function (left) {
				this.first = left;
				this.second = expression(bp-1);
				return this;
			}
		}
	}

	function prefix(id, bp) {
		var s = symbolTable[id];
		if (s) {
			s.prototype.nud = function () {
				this.first = expression(bp);
				return this;
			}
		}
	}

	function bindEval(id, fn) {
		var s = symbolTable[id];
		if (s) {
			s.prototype.val = fn;
		}
	}


	// parser
	var token, tokenList;

	function expression(rbp) {
		var t = token;
		token = next();
		var left = t.nud();
		while (rbp < token.lbp) {
			t = token;
			token = next();
			left = t.led(left);
		}
		return left;
	}

	function next() {
		return tokenList.shift();
	}

	function expect(id) {
		if (id && token.id != id) {
			throw new Error('Expected %1'.replace('%1', id));
		}
		token = next();
	}

	// tokenizer
	var regexpTable = {
		'whitespace' : {
			r : /^(\s+)/,
			f : function (str) {
				return undefined;
			}
		},
		'separator' : {
			r : /^(,)/,
			f : function (str) {
				var s = new symbolTable[','];
				return s;
			}
		},
		'operator' : {
			r : /^([+\-*\/\^%]|>{2,3}|<<)/,
			f : function (str) {
				return (new symbolTable[str]);
			}
		},
		'bracket' : {
			r : /^(\(|\))/,
			f : function (str) {
				return (new symbolTable[str]);
			}
		},
		'hex' : {
			r : /^(0x[0-9a-f]+)/,
			f : function (str) {
				var s = new symbolTable['(literal)'];
				s.value = parseInt(str);
				return s;
			}
		},
		'bin' : {
			r : /^(0b[01]+)/,
			f : function (str) {
				// @todo
			}
		},
		'float' : {
			r : /^(\d*\.\d+(e\d+)*)/,
			f : function (str) {
				var s = new symbolTable['(literal)'];
				s.value = parseFloat(str);
				return s;
			}
		},
		'integer' : {
			r : /^(\d+)/,
			f : function (str) {
				var s = new symbolTable['(literal)'];
				s.value = parseInt(str);
				return s;
			}
		},
		'name' : {
			r : /^(\w+)/,
			f : function (str) {
				var s;
				if (str == 'e') {
					s = new symbolTable['(literal)'];
					s.value = Math.E;
				} else if (str == 'pi') {
					s = new symbolTable['(literal)'];
					s.value = Math.PI;
				} else {
					s = new symbolTable['(name)'];
					s.value = str;
				}
				return s;
			}
		}
	};

	function tokenize(str) {
		tokenList = [];
		var idx = 0, i, flag,
			curType, curRegexp, curMatch, curToken;
		i = 0;
		while (str.length > 0) {
			flag = false;
			for (curType in regexpTable) {
				curMatch = str.match(regexpTable[curType].r);
				if (curMatch&&curMatch[1]) {
					flag = true;
					curToken = regexpTable[curType].f(curMatch[1]);
					if (curToken) {
						tokenList.push(curToken);
					}
					i += curMatch[1].length;
					str = str.slice(curMatch[1].length);
					break;
				}
			}
			if (!flag) {
				throw new Error('Unknow syntax at "' + str + '"');
			}
		}
		tokenList.push(new symbolTable['(end)']);
		token = tokenList.shift();
	}

	// grammer configuration
	symbol('(literal)').prototype.nud = function () {
		return this;
	}
	symbol('(name)').prototype.nud = function () {
		return this;
	}
	symbol('<<', 100); symbol('>>', 100); symbol('>>>', 100);
	symbol('+', 110); symbol('-', 110);
	symbol('*', 120); symbol('/', 120); symbol('%', 120);
	symbol('^', 130);
	symbol('(', 150); symbol(')');
	symbolTable['('].prototype.nud = function () {
		var expr = expression(0);
		expect(')');
		return expr;
	};
	symbolTable['('].prototype.led = function (left) {
		this.first = left;
		this.second = [];
		if (token.id != ')') {
			while (true) {
				this.second.push(expression(0));
				if (token.id != ',') {
					break;
				}
				expect(',');
			}
		}
		expect(')');
		return this;
	};
	symbol(',');
	symbol('(end)');

	infix('<<', 100); infix('>>', 100); infix('>>>', 100);
	infix('+', 110); infix('-', 110);
	infix('*', 120); infix('/', 120); infix('%', 120);
	infix_r('^', 140);

	prefix('+', 130);
	prefix('-', 130);

	bindEval('(literal)', function () { return this.value; });
	bindEval('+', function () {
		if (this.second != undefined) {
			return this.first.val() + this.second.val();
		} else {
			return this.first.val();
		}
	});
	bindEval('-', function () {
		if (this.second != undefined) {
			return this.first.val() - this.second.val();
		} else {
			return -this.first.val();
		}
	});
	bindEval('*', function () {	return this.first.val() * this.second.val(); });
	bindEval('/', function () { return this.first.val() / this.second.val(); });
	bindEval('%', function () { return this.first.val() % this.second.val(); });
	bindEval('^', function () { return Math.pow(this.first.val(), this.second.val()); });
	bindEval('<<', function () { return this.first.val() << this.second.val(); });
	bindEval('>>', function () { return this.first.val() >> this.second.val(); });
	bindEval('>>>', function () { return this.first.val() >>> this.second.val(); });
	bindEval('(', function () {
		var fn = mathFunctions[this.first.value],
			args = [];
		if (!(fn instanceof Function)) {
			throw new Error('Unknown function %1.'.replace(this.first.value));
		}
		for (var i = 0, n = this.second.length;i < n;i++) {
			args.push(this.second[i].val());
		}
		return fn.apply(null, args);
	});

	return {
		evaluate : function (expr) {
			var root, result = {
				success : true,
				answer : 0
			};
			try {
				tokenize(expr.toLowerCase());
				root = expression(0);
				result.answer = root.val();
			} catch (err) {
				result.success = false;
				result.msg = err.toString();
			}
			return result;
		}
	}

})();