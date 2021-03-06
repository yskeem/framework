#include <samchon/protocol/master/ParallelSystemArray.hpp>

#include <samchon/protocol/master/PRInvokeHistory.hpp>

#include <array>

using namespace std;
using namespace samchon;
using namespace samchon::library;
using namespace samchon::protocol;
using namespace samchon::protocol::master;

/* ---------------------------------------------------------
	CONSTRUCTORS
--------------------------------------------------------- */
ParallelSystemArray::ParallelSystemArray()
	: super()
{
	history_sequence = 0;
}
ParallelSystemArray::~ParallelSystemArray()
{
}

/* ---------------------------------------------------------
	MESSAGE CHAIN
--------------------------------------------------------- */
void ParallelSystemArray::sendPieceData(shared_ptr<Invoke> invoke, size_t index, size_t size)
{
	// CHECK VALIDITY - RESERVED PARAMETER
	static const std::array<std::string, 3> RESERVED_PARAMETERS = {"invoke_history_uid", "piece_index", "piece_size"};

	for (size_t i = 0; i < RESERVED_PARAMETERS.size(); i++)
		if (invoke->has(RESERVED_PARAMETERS[i]) == true)
			throw std::domain_error("Parameter " + RESERVED_PARAMETERS[i] + " is a reserved parameter in the ParallelSystem. Replace your name to another.");

	// INSERT HISTORY_UID
	invoke->emplace_back(new InvokeParameter("invoke_history_uid", ++history_sequence));

	// SPLIT TO PIECES AND SEND TO EACH SYSTEM
	for (size_t i = 0; i < this->size(); i++)
	{
		shared_ptr<ParallelSystem> &system = this->at(i);

		size_t piece_size = (i == this->size() - 1)
			? size - index
			: (size_t)(size / this->size() * system->getPerformance());
		if (piece_size == 0)
			continue;

		system->send_piece_data(invoke, index, piece_size);
		index += piece_size;
	}
}

auto ParallelSystemArray::notify_end(std::shared_ptr<PRInvokeHistory> history) -> bool
{
	size_t uid = history->getUID();

	// ALL THE SUB-TASKS ARE DONE?
	for (size_t i = 0; i < this->size(); i++)
		if (this->at(i)->progress_list.has(uid) == true)
			return false;

	///////
	// RE-CALCULATE PERFORMANCE INDEX
	///////
	// CONSTRUCT BASIC DATA
	std::vector<pair<std::shared_ptr<ParallelSystem>, double>> system_pairs;
	double performance_index_avergae = 0.0;

	system_pairs.reserve(this->size());
	for (size_t i = 0; i < this->size(); i++)
	{
		std::shared_ptr<ParallelSystem> system = this->at(i);
		if (system->history_list.has(uid) == false)
			continue;

		shared_ptr<PRInvokeHistory> &my_history = system->history_list.get(uid);
		double performance_index = my_history->getSize() / (double)my_history->getElapsedTime();

		system_pairs.push_back({ system, performance_index });
		performance_index_avergae += performance_index;
	}
	performance_index_avergae /= system_pairs.size();

	// RE-CALCULATE PERFORMANCE INDEX
	for (size_t i = 0; i < system_pairs.size(); i++)
	{
		shared_ptr<ParallelSystem> system = system_pairs.at(i).first;
		double new_performance = system_pairs.at(i).second / performance_index_avergae;

		double ordinary_ratio = max(0.3, 1.0 / (system->history_list.size() - 1.0));
		system->performance = (system->performance * ordinary_ratio) + (new_performance * (1 - ordinary_ratio));
	}
	this->normalize_performance();

	return true;
}

void ParallelSystemArray::normalize_performance()
{
	// CALC AVERAGE
	double average = 0.0;

	for (size_t i = 0; i < this->size(); i++)
		average += this->at(i)->performance;
	average /= this->size();

	// DIVIDE FROM THE AVERAGE
	for (size_t i = 0; i < this->size(); i++)
		this->at(i)->performance /= average;
}