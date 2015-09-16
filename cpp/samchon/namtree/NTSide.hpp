#pragma once
#include <samchon/API.hpp>

#include <samchon/protocol/Entity.hpp>

#include <vector>

namespace samchon
{
	namespace namtree
	{
		class NTFactory;
		class NTFile;
		class NTIterator;

		/**
		 * @brief A side of a conditional expresson
		 *
		 * @author Jeongho Nam
		 */
		class SAMCHON_FRAMEWORK_API NTSide
			: public virtual protocol::Entity
		{
		private:
			typedef protocol::Entity super;

		protected:
			virtual auto TAG() const -> std::string override;
			
			NTFactory *factory;
			NTFile *file;
			std::vector<double> parameters;

		public:
			NTSide(NTFactory*);
			virtual ~NTSide() = default;

			virtual void construct(std::shared_ptr<library::XML>) override;

			virtual void initRetrieve();
			auto calcRetrieved(NTIterator&) const -> double;

			virtual auto toXML() const -> std::shared_ptr<library::XML> override;
		};
	};
};