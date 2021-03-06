/// <reference path="../API.ts" />

/// <reference path="EntityArray.ts" />
/// <reference path="Entity.ts" />

namespace samchon.protocol
{
	/**
	 * <p> Standard message of network I/O. </p>
	 * 
	 * <p> {@link Invoke} is a class used in network I/O in protocol package of Samchon Framework. </p>
	 *
	 * <p> The Invoke message has an XML structure like the result screen of provided example in below. 
	 * We can enjoy lots of benefits by the normalized and standardized message structure used in
	 * network I/O. </p>
	 *
	 * <p> The greatest advantage is that we can make any type of network system, even how the system 
	 * is enourmously complicated. As network communication message is standardized, we only need to
	 * concentrate on logical relationships between network systems. We can handle each network system 
	 * like a object (class) in OOD. And those relationships can be easily designed by using design
	 * pattern. </p>
	 *
	 * <p> In Samchon Framework, you can make any type of network system with basic componenets
	 * (IProtocol, IServer and ICommunicator) by implemens or inherits them, like designing
	 * classes of S/W architecture. </p>
	 *
	 * @see IProtocol
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export class Invoke
		extends EntityArray<InvokeParameter>
	{
		/**
		 * <p> Listener, represent function's name. </p>
		 */
		protected listener: string;

		/* -------------------------------------------------------------------
			CONSTRUCTORS
		------------------------------------------------------------------- */
		public constructor(listener: string);

		/**
		 * Copy Constructor. 
		 *
		 * @param invoke
		 */
		public constructor(invoke: Invoke);

		/**
		 * Construct from XML.
		 * 
		 * @param xml
		 */
		public constructor(xml: library.XML);

		public constructor(listener: string, begin: std.VectorIterator<InvokeParameter>, end: std.VectorIterator<InvokeParameter>);

		/**
		 * Construct from listener and parametric values.
		 * 
		 * @param listener
		 * @param parameters
		 */
		public constructor(listener: string, ...parameters: Array<number|string|library.XML>);

		public constructor(...args: any[])
		{
			super();

			if (args.length == 0)
			{
				this.listener = "";
			}
			else if (args.length == 1 && typeof args[0] == "string")
			{
				let listener: string = args[0];

				this.listener = listener;
			}
			else if (args.length == 1 && args[0] instanceof library.XML)
			{
				this.listener = "";
				let xml: library.XML = args[0];

				this.construct(xml);
			}
			else if (args.length == 1 && args[0] instanceof Invoke) 
			{
				let invoke: Invoke = args[0];

				this.listener = invoke.listener;
				this.assign(invoke.begin(), invoke.end());
			}
			else if (args.length == 3 && args[1] instanceof std.VectorIterator && args[2] instanceof std.VectorIterator)
			{
				let listener: string = args[0];
				let begin: std.VectorIterator<InvokeParameter> = args[1];
				let end: std.VectorIterator<InvokeParameter> = args[2];

				this.listener = listener;
				this.assign(begin, end);
			}
			else if (args.length > 1)
			{
				this.listener = args[0];

				for (let i: number = 1; i < args.length; i++)
					this.push_back(new InvokeParameter("", args[i]));
			}
		}
		
		/**
		 * @inheritdoc
		 */
		protected createChild(xml: library.XML): InvokeParameter
		{
			return new InvokeParameter();
		}

		/* -------------------------------------------------------------------
			GETTERS
		------------------------------------------------------------------- */ 
		/**
		 * Get listener.
		 */ 
		public getListener(): string
		{
			return this.listener;
		}

		/**
		 * <p> Get arguments for Function.apply(). </p>
		 *
		 * @return An array containing values of the contained parameters.
		 */
		public getArguments(): Array<any>
		{
			let args: Array<any> = [];

			for (let i: number = 0; i < this.size(); i++)
				if (this[i].getName() == "invoke_history_uid")
					continue;
				else
					args.push(this[i].getValue());

			return args;
		}

		/* -------------------------------------------------------------------
			APPLY BY FUNCTION POINTER
		------------------------------------------------------------------- */
		/**
		 * <p> Apply to a matched function. </p>
		 */
		public apply(obj: IProtocol): boolean
		{
			if (!(this.listener in obj && obj[this.listener] instanceof Function))
				return false;
		
			let func: Function = obj[this.listener];
			let args: Array<any> = this.getArguments();

			func.apply(obj, args);

			return true;
		}

		/* -------------------------------------------------------------------
			EXPORTERS
		------------------------------------------------------------------- */
		/**
		 * @inheritdoc
		 */
		public TAG(): string
		{
			return "invoke";
		}

		/**
		 * @inheritdoc
		 */
		public CHILD_TAG(): string 
		{
			return "parameter";
		}
	}
}

namespace samchon.protocol
{
	/**
	 * A parameter belongs to an Invoke.
	 *
	 * @see Invoke
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export class InvokeParameter
		extends Entity
	{
		/**
		 * <p> Name of the parameter. </p>
		 *
		 * @details Optional property, can be omitted.
		 */
		protected name: string = "";

		/**
		 * <p> Type of the parameter. </p>
		 */
		protected type: string = "";

		/** 
		 * <p> Value of the parameter. </p>
		 */
		protected value: string | number | library.XML = null;

		/**
		 * Default Constructor.
		 */
		public constructor();

		/**
		 * Initialization Constructor without type specification.
		 * 
		 * @param name
		 * @param val
		 */
		public constructor(name: string, val: string|number|library.XML);

		/**
		 * Initialization Constructor.
		 * 
		 * @param name
		 * @param type
		 * @param val
		 */
		public constructor(name: string, type: string, val: string|number|library.XML);

		/* -------------------------------------------------------------------
			CONSTRUCTORS
		------------------------------------------------------------------- */
		public constructor(...args: any[])
		{
			super();

			if (args.length == 0)
				return;
			else if (args.length == 2)
			{
				this.name = args[0];
				this.value = args[1];
			}
			else if (args.length == 3)
			{
				this.name = args[0];
				this.value = args[2];
			}

			this.type = typeof this.value;
			if (this.value instanceof library.XML)
				this.type = "XML";
		}

		/**
		 * @inheritdoc
		 */
		public construct(xml: library. XML): void
		{
			this.name = (xml.hasProperty("name")) ? xml.getProperty("name") : "";
			this.type = xml.getProperty("type");

			if (this.type == "XML")
				this.value = xml.begin().second.front();
			else if (this.type == "number")
				this.value = parseFloat(xml.getValue());
			else
				this.value = xml.getValue();
		}

		public setValue(value: number | string | library.XML): void
		{
			this.value = value;
		}

		/* -------------------------------------------------------------------
			GETTERS
		------------------------------------------------------------------- */
		/**
		 * @inheritdoc
		 */
		public key(): any
		{
			return this.name;
		}

		/**
		 * Get name.
		 */
		public getName(): string
		{
			return this.name;
		}

		/**
		 * Get type.
		 */
		public getType(): string
		{
			return this.type;
		}

		/**
		 * Get value.
		 */
		public getValue(): any
		{
			return this.value;
		}

		/* -------------------------------------------------------------------
			EXPORTERS
		------------------------------------------------------------------- */
		/**
		 * @inheritdoc
		 */
		public TAG(): string
		{
			return "parameter";
		}
		
		/**
		 * @inheritdoc
		 */
		public toXML(): library.XML
		{
			let xml: library.XML = new library.XML();
			xml.setTag(this.TAG());

			xml.setProperty("name", this.name);
			xml.setProperty("type", this.type);

			// NOT CONSIDERED ABOUT THE BINARY DATA
			if (this.type == "XML")
				xml.push(this.value as library.XML);
			else if (this.type != "ByteArray")
				xml.setValue(this.value + "");

			return xml;
		}
	}
}