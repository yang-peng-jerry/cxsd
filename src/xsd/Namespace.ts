// This file is part of fast-xml, copyright (c) 2015 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import {Loader} from './Loader';
import {Source} from './Source';
import {Scope} from './Scope';

/** XML namespace, binding it to syntax definitions. */

export class Namespace {
	constructor(id: number) {
		this.id = id;
	}

	/** Initialize names and addresses. Can be called multiple times. */
	init(name: string, url?: string, short?: string) {
		if(name) {
			if(!this.name) this.name = name;
			Namespace.tbl[name] = this;
		}

		if(url) {
			if(!this.url) this.url = url;
			Namespace.tbl[url] = this;
		}

		if(short) {
			if(!this.short) this.short = short;
			Namespace.tbl[short] = this;
		}

		return(this);
	}

	/** Globally register a namespace, to attach handlers to it. */
	static register(name: string, url?: string, short?: string) {
		var namespace = Namespace.tbl[name] || Namespace.tbl[url];

		if(!namespace) {
			var id = Namespace.list.length;

			namespace = new Namespace(id);
			Namespace.list[id] = namespace;
		}

		return(namespace.init(name, url, short));
	}

	/** Find a globally registered namespace. */
	static lookup(name: string) {
		return(Namespace.tbl[name]);
	}

	/** Load and parse the main schema file for this namespace. */
	importSchema(loader: Loader, urlRemote?: string) {
		return(loader.importFile(this, urlRemote || this.url));
	}

	/** Update final address of schema file if HTTP request was redirected. */
	updateUrl(urlOld: string, urlNew: string) {
		if(!this.url || this.url == urlOld) this.url = urlNew;
	}

	/** Fetch the root scope with published attributes, groups, elements... */
	getScope() { return(this.scope); }

	/** Internal list of namespaces indexed by a surrogate key. */
	private static list: Namespace[] = [];

	/** Table of namespaces based on their names and addresses. */
	private static tbl: {[name: string]: Namespace} = {};

	/** Surrogate key, used internally as a unique namespace ID. */
	id: number;

	/** URL address identifying the namespace (not used to download anything). */
	name: string;

	/** URL address where main schema file was downloaded. */
	url: string;

	/** Example short name for the namespace, currently unused. */
	private short: string;

	/** Global scope where exported members will be published. */
	private scope: Scope = new Scope(null, this);
}