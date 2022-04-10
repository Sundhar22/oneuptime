/**
 * @fileoverview Disallow sparse arrays
 * @author Nicholas C. Zakas
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('../shared/types').Rule} */
module.exports = {
    meta: {
        type: "problem",

        docs: {
            description: "disallow sparse arrays",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-sparse-arrays"
        },

        schema: [],

        messages: {
            unexpectedSparseArray: "Unexpected comma in middle of array."
        }
    },

    create(context) {


        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        return {

            ArrayExpression(node) {

                const emptySpot = node.elements.indexOf(null) > -1;

                if (emptySpot) {
                    context.report({ node, messageId: "unexpectedSparseArray" });
                }
            }

        };

    }
};
