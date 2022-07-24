// This file is part of cxsd, copyright (c) 2015-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as types from "./types";
import { Namespace } from "./Namespace";
import { QName } from "./QName";

export interface TypeMember {
  min: number;
  max: number;
  item: types.Base;
}

export interface NamedTypeMember extends TypeMember {
  name: string;
}

function addMemberToTable(
  tbl: Map<string, TypeMember>,// { [name: string]: TypeMember },
  name: string,
  specNew: TypeMember,
  min = 1,
  max = 1
) {
  // var spec = tbl[name];
  var spec = tbl.get(name);

  if (spec) {
    spec.min += specNew.min * min;
    spec.max += specNew.max * max;
  } else {
    spec = {
      min: specNew.min * min,
      max: specNew.max * max,
      item: specNew.item
    };

    tbl.set(name, spec);
    // tbl[name] = spec;
  }
}

/** Scope handles looking up references by type and name, and binding member
 * types and elements to types or namespaces. */

export class Scope {
  constructor(parent: Scope, namespace?: Namespace) {
    if (!namespace && parent) namespace = parent.namespace;

    this.parent = parent;
    this.namespace = namespace;
  }

  add(
    name: string,
    kind: string,
    target: types.Base,
    min: number,
    max: number
  ) {
    if (name) {
      var visibleTbl = this.visible[kind];

      if (!visibleTbl) {
        visibleTbl = {};
        this.visible[kind] = visibleTbl;
      }

      visibleTbl[name] = target;
    }

    if (max) {
      var exposeList = this.expose[kind];

      if (!exposeList) {
        exposeList = [];
        this.expose[kind] = exposeList;
      }

      exposeList.push({
        name: name,
        min: min,
        max: max,
        item: target
      });
    }
  }

  addToParent(
    name: string,
    kind: string,
    target: types.Base,
    min: number,
    max: number
  ) {
    this.parent.add(name, kind, target, min, max);
  }

  addContentToParent(
    kind: string,
    target: types.Base,
    min: number,
    max: number
  ) {
    this.parent.add(null, kind, target, min, max);
  }

  addAllToParent(kind: string, min = 1, max = 1, target?: Scope) {
    // Check if there's anything to add.
    if (!this.expose[kind]) return;
    if (!target) target = this;
    target = target.parent;

    for (var spec of this.expose[kind]) {
      // TODO: If target is a choice, it must take the overall min and max.
      target.add(spec.name, kind, spec.item, spec.min * min, spec.max * max);
    }
  }

  addComments(commentList: string[]) {
    this.commentList = (this.commentList || []).concat(commentList);
  }

  addCommentsToGrandParent(commentList: string[]) {
    this.parent.parent.addComments(commentList);
  }

  getComments() {
    if (!this.commentList) return null;

    // Convert line breaks.
    return this.commentList.join("").replace(/\r\n?|\n/g, "\n");
  }

  lookup(name: QName, kind: string): types.Base {
    var scope: Scope = this;
    var nameFull = name.nameFull;
    var nameWild = "*:" + name.name;

    if (name.namespace && name.namespace != this.namespace) {
      scope = name.namespace.getScope();
    }

    var iter = 100;

    while (scope && --iter) {
      if (scope.visible[kind]) {
        var result =
          scope.visible[kind][nameFull] || scope.visible[kind][nameWild];

        if (result) return result;
      }

      scope = scope.parent;
    }

    try {
      throw new Error("Missing " + kind + ": " + name.name);
    } catch (err) {
      console.log(err.stack);
    }
  }

  // Types

  setType(type: types.TypeBase) {
    // TODO: set to some invalid value if called more than once.
    if (!this.type && this.namespace.getScope() != this) this.type = type;
  }

  setParentType(type: types.TypeBase) {
    this.parent.setType(type);
  }

  getParentType(namespace: Namespace): types.TypeBase {
    for (
      var parent = this.parent;
      parent && parent.namespace == namespace;
      parent = parent.parent
    ) {
      if (parent.type) return parent.type;
    }

    return null;
  }

  getType(): types.TypeBase {
    return this.type;
  }

  dumpTypes(kind: string) {
    return this.expose[kind];
  }

  dumpMembers(kind: string, groupKind: string): Map<string, TypeMember> {
    var itemList = this.expose[kind] || [];
    var groupList = this.expose[groupKind] || [];
    var mapOutput = new Map<string, TypeMember>();
    //var output: { [name: string]: TypeMember } = {};

    for (var spec of itemList) {
      if (spec.name) addMemberToTable(mapOutput, spec.name, spec);
    }

    for (var group of groupList) {
      var min = group.min;
      var max = group.max;

      var attributeTbl = group.item.getScope().dumpMembers(kind, groupKind);

      for (var key of attributeTbl.keys()) {
        addMemberToTable(mapOutput, key, attributeTbl.get(key), min, max);
      }
    }

    /*
    var output: { [name: string]: TypeMember } = {};
    for (let key of mapOutput.keys()) {
      output[key] = mapOutput.get(key);
    }
    return output;
    */
    return mapOutput;
  }

  private parent: Scope;
  namespace: Namespace;

  private visible = {} as {
    [kind: string]: { [name: string]: types.Base };
  };

  private expose: {
    [kind: string]: NamedTypeMember[];
  } = {};

  private type: types.TypeBase;

  private commentList: string[];

  private static primitiveScope: Scope;
}
