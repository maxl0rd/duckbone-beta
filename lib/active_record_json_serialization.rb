# ActiveRecord normally suppresses included assocations from JSON if they have no values.
# Duckbone expects to be told if an association becomes empty or null,
# so this change causes AR to always serialize empty associations as null or empty array.

if defined?(ActiveRecord::Base)

  ActiveRecord::Serialization.module_eval do
    def serializable_hash(options = nil)
      options = options.try(:clone) || {}

      options[:except] = Array.wrap(options[:except]).map { |n| n.to_s }
      options[:except] |= Array.wrap(self.class.inheritance_column)

      hash = super(options)

      serializable_add_includes(options) do |association, records, opts|
        hash[association] = records.is_a?(Enumerable) ?
          records.map { |r| r.serializable_hash(opts) } :
          records && records.serializable_hash(opts)
      end

      hash
    end

    def serializable_add_includes(options = {})
      return unless include_associations = options.delete(:include)

      include_has_options = include_associations.is_a?(Hash)
      associations = include_has_options ? include_associations.keys : Array.wrap(include_associations)

      associations.each do |association|
        records = case self.class.reflect_on_association(association).macro
        when :has_many, :has_and_belongs_to_many
          send(association).to_a
        when :has_one, :belongs_to
          send(association)
        end

        association_options = include_has_options ? include_associations[association] : {}
        yield(association, records, association_options)
      end
      options[:include] = include_associations
    end
  end

end

