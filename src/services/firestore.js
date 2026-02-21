/**
 * Firestore REST API client for Cloudflare Workers
 * Uses REST API instead of Admin SDK (incompatible with Workers)
 */

const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1';

/**
 * Firestore client for CRUD operations
 */
export class FirestoreClient {
	constructor(projectId, apiKey) {
		this.projectId = projectId;
		this.apiKey = apiKey;
		this.baseUrl = `${FIRESTORE_API_BASE}/projects/${projectId}/databases/(default)/documents`;
	}

	/**
	 * Convert JS object to Firestore fields format
	 */
	toFirestoreFields(obj) {
		const fields = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value === null || value === undefined) continue;

			if (typeof value === 'string') {
				fields[key] = { stringValue: value };
			} else if (typeof value === 'number') {
				if (Number.isInteger(value)) {
					fields[key] = { integerValue: value };
				} else {
					fields[key] = { doubleValue: value };
				}
			} else if (typeof value === 'boolean') {
				fields[key] = { booleanValue: value };
			} else if (value instanceof Date) {
				fields[key] = { timestampValue: value.toISOString() };
			} else if (Array.isArray(value)) {
				fields[key] = {
					arrayValue: {
						values: value.map(v => this.toFirestoreFields({ v }).v)
					}
				};
			} else if (typeof value === 'object') {
				fields[key] = {
					mapValue: {
						fields: this.toFirestoreFields(value)
					}
				};
			}
		}
		return fields;
	}

	/**
	 * Convert Firestore fields to JS object
	 */
	fromFirestoreFields(fields) {
		if (!fields) return {};

		const obj = {};
		for (const [key, value] of Object.entries(fields)) {
			if (value.stringValue !== undefined) {
				obj[key] = value.stringValue;
			} else if (value.integerValue !== undefined) {
				obj[key] = parseInt(value.integerValue);
			} else if (value.doubleValue !== undefined) {
				obj[key] = value.doubleValue;
			} else if (value.booleanValue !== undefined) {
				obj[key] = value.booleanValue;
			} else if (value.timestampValue !== undefined) {
				obj[key] = value.timestampValue;
			} else if (value.arrayValue !== undefined) {
				obj[key] = (value.arrayValue.values || []).map(v =>
					this.fromFirestoreFields({ temp: v }).temp
				);
			} else if (value.mapValue !== undefined) {
				obj[key] = this.fromFirestoreFields(value.mapValue.fields);
			}
		}
		return obj;
	}

	/**
	 * Extract document ID from full path
	 */
	extractDocId(path) {
		const parts = path.split('/');
		return parts[parts.length - 1];
	}

	/**
	 * Create a document
	 */
	async createDocument(collection, data) {
		const url = `${this.baseUrl}/${collection}?key=${this.apiKey}`;
		const fields = this.toFirestoreFields(data);

		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fields }),
			});

			if (!res.ok) {
				const error = await res.text();
				throw new Error(`Firestore create error: ${res.status} - ${error}`);
			}

			const doc = await res.json();
			return {
				id: this.extractDocId(doc.name),
				...this.fromFirestoreFields(doc.fields),
			};
		} catch (err) {
			console.error('createDocument error:', err);
			throw err;
		}
	}

	/**
	 * Get a document by ID
	 */
	async getDocument(collection, docId) {
		const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;

		try {
			const res = await fetch(url);

			if (res.status === 404) {
				return null;
			}

			if (!res.ok) {
				const error = await res.text();
				throw new Error(`Firestore get error: ${res.status} - ${error}`);
			}

			const doc = await res.json();
			return {
				id: docId,
				...this.fromFirestoreFields(doc.fields),
			};
		} catch (err) {
			console.error('getDocument error:', err);
			throw err;
		}
	}

	/**
	 * Update a document
	 */
	async updateDocument(collection, docId, data) {
		const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;
		const fields = this.toFirestoreFields(data);

		try {
			const res = await fetch(url, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fields }),
			});

			if (!res.ok) {
				const error = await res.text();
				throw new Error(`Firestore update error: ${res.status} - ${error}`);
			}

			const doc = await res.json();
			return {
				id: docId,
				...this.fromFirestoreFields(doc.fields),
			};
		} catch (err) {
			console.error('updateDocument error:', err);
			throw err;
		}
	}

	/**
	 * Delete a document
	 */
	async deleteDocument(collection, docId) {
		const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;

		try {
			const res = await fetch(url, {
				method: 'DELETE',
			});

			if (!res.ok && res.status !== 404) {
				const error = await res.text();
				throw new Error(`Firestore delete error: ${res.status} - ${error}`);
			}

			return true;
		} catch (err) {
			console.error('deleteDocument error:', err);
			throw err;
		}
	}

	/**
	 * Query documents (simplified - filter by one field)
	 */
	async queryDocuments(collection, filters = {}) {
		// For complex queries, we'll use runQuery endpoint
		const url = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

		// Build structured query
		const query = {
			structuredQuery: {
				from: [{ collectionId: collection }],
				where: {},
			}
		};

		// Add filters
		if (Object.keys(filters).length > 0) {
			const fieldFilters = [];
			for (const [field, value] of Object.entries(filters)) {
				const firestoreValue = this.toFirestoreFields({ value }).value;
				fieldFilters.push({
					fieldFilter: {
						field: { fieldPath: field },
						op: 'EQUAL',
						value: firestoreValue,
					}
				});
			}

			if (fieldFilters.length === 1) {
				query.structuredQuery.where = fieldFilters[0];
			} else if (fieldFilters.length > 1) {
				query.structuredQuery.where = {
					compositeFilter: {
						op: 'AND',
						filters: fieldFilters,
					}
				};
			}
		}

		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(query),
			});

			if (!res.ok) {
				const error = await res.text();
				throw new Error(`Firestore query error: ${res.status} - ${error}`);
			}

			const results = await res.json();

			if (!results || results.length === 0) {
				return [];
			}

			return results
				.filter(r => r.document)
				.map(r => ({
					id: this.extractDocId(r.document.name),
					...this.fromFirestoreFields(r.document.fields),
				}));
		} catch (err) {
			console.error('queryDocuments error:', err);
			throw err;
		}
	}
}
