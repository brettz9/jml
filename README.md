INCOMPLETE

Naming
======

JML (for JavaScript or Json Markup Language), pronounced "Jamilih"
for the Arabic word meaning "Beauty". It is named in honor of the Arabic name
of my dear newly-born daughter.

Design goals
==========

1. Be as succinct as possible while being sufficiently functional; avoid null place-holders, etc.
2. Allow reliable iteration order (i.e., use arrays over objects except where order is not needed).
3. Allow for use as a template language, with the opportunity for function calls to easily 
	add elements, attributes, or child content without needing to retool the entire structure or
	write complex functions to handle the merging.
4. Use a syntax with a minimum of constructs not familiar to XML/HTML users (if any), allowing
	for near immediate adoption by any web developer.
5. Work with XML or HTML and optionally support faithful rebuilding of an entire XML document
6. Ability to write libraries which support regular XML needs like XPath expressions (which are more
   appropriate for HTML than those targeted for open-ended JSON, such as JSONPath). Avoid need to 
   convert to DOM where possible (and even implement DOM interfaces for it in a modular fashion).
7. Work with JSON, but also allow flexible usage within full JavaScript, such as to allow 
	dropping in DOM nodes or optional DOM mode for attachment of events (but with a preference
	toward internal string concatenation for speed).
8. Be intuitive so that one is not likely to be confused about whether one is looking at 
	element siblings, children, text, etc.

Prior work:

The only work which comes close to meeting these goals as far as I have been able to find is JsonML. 
JsonML even does a better job of goal #1 in terms of succinctness than my proposal for Jamilih. However, 
for goal #3, I believe JML will be more flexible for regular usage in templates, and possibly also
superior in goal #8 (and with a plan for goal #5 and #7?).
