# Story model v0.1

The Story model describes narrative data independently from Reader presentation.
It supports a version `0.1` manifest, narrative and ending nodes, six content
types, optional node effects, invisible conditional routing nodes, and Choice
nodes. Conditional nodes contain ordered branches and a required fallback;
they never contain content or effects. Choice nodes contain one or more labelled
options with optional conditions and effects plus a required next target. They
never contain visible content or node-level effects.

Choice is a backward-compatible schema `0.1` extension. Choice IDs need only be
unique within one Choice node. Choice and Conditional edges participate in
generic target validation and graph cycle detection.
