A Simple Math Evaluator in JavaScript
=====================================

As a practice in writing a tokenizer and parser. Currently support real math operations. Next version will include complex number operations. Inspired by http://effbot.org/zone/simple-top-down-parsing.htm

Usage
-----

Simple pass a string to the evaluator and it will parse and evaluate the result. The result is an Object containing three properties:

+ success (Boolean) - whether evaluation is successful
+ msg (String) - error message
+ answer (Number) - actual result

It support almost all arithmetic operations including +, -, *, /, ^, %, and shift operations like >>, >>>, <<:

	\>MathEvaluator.evaluate('(1+2^3)%3-4>>1')
	\>{success:true, answer:-2}

It also support basic functions like sin, cos, tan, exp, log, etc:

	\>MathEvaluator.evaluate('sin(pi/2)+1')
	\>{success:true, answer:2}
